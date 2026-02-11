from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import CustomUser, USSDTransaction, Task
import json
import logging

logger = logging.getLogger(__name__)

class USSDHandler:
    """Main USSD handler class for the platform"""
    
    @staticmethod
    @csrf_exempt
    def handle_request(request):
        """Main entry point for USSD callbacks"""
        if request.method == 'POST':
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                session_id = data.get('sessionId')
                phone_number = data.get('phoneNumber')
                text = data.get('text', '')
            else:
                session_id = request.POST.get('sessionId')
                phone_number = request.POST.get('phoneNumber')
                text = request.POST.get('text', '')
            
            # Get or create transaction session
            transaction, created = USSDTransaction.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'phone_number': phone_number,
                    'text': text
                }
            )
            
            if not created:
                transaction.text = text
                transaction.save()
            
            # Process USSD request
            response_text = USSDHandler.process_ussd(phone_number, text, transaction)
            
            return HttpResponse(response_text)
        
        return HttpResponse("END Invalid request method")
    
    @staticmethod
    def process_ussd(phone_number, text, transaction):
        """Process USSD menu logic"""
        
        # Split the text input into levels
        text = text.strip()
        inputs = text.split('*') if text else []
        current_level = len(inputs)
        
        # Welcome screen - No input yet
        if current_level == 0 or (current_level == 1 and not inputs[0]):
            return USSDHandler.welcome_screen()
        
        # Main menu selection
        if current_level == 1:
            return USSDHandler.main_menu(inputs[0])
        
        # Process submenus based on first selection
        main_option = inputs[0]
        
        # Registration flow
        if main_option == '1':  # Register
            return USSDHandler.handle_registration(phone_number, inputs[1:], transaction)
        
        # Login flow
        elif main_option == '2':  # Login
            return USSDHandler.handle_login(phone_number, inputs[1:], transaction)
        
        # Client menu
        elif main_option == '3':  # Client services
            return USSDHandler.handle_client_menu(phone_number, inputs[1:], transaction)
        
        # Employee menu
        elif main_option == '4':  # Employee services
            return USSDHandler.handle_employee_menu(phone_number, inputs[1:], transaction)
        
        # Admin menu
        elif main_option == '5':  # Admin services
            return USSDHandler.handle_admin_menu(phone_number, inputs[1:], transaction)
        
        return USSDHandler.error_screen()
    
    @staticmethod
    def welcome_screen():
        """Welcome screen"""
        return """CON Welcome to Transparency Platform
1. Register
2. Login
3. Client Services
4. Employee Services
5. Admin Services"""
    
    @staticmethod
    def main_menu(option):
        """Main menu response"""
        if option == '1':
            return "CON Register as:\n1. Client\n2. Employee"
        elif option == '2':
            return "CON Enter your phone number to login"
        elif option == '3':
            return USSDHandler.client_menu()
        elif option == '4':
            return USSDHandler.employee_menu()
        elif option == '5':
            return USSDHandler.admin_menu()
        else:
            return "END Invalid option selected"
    
    @staticmethod
    def handle_registration(phone_number, inputs, transaction):
        """Handle user registration flow"""
        current_step = len(inputs)
        
        # Step 1: Select user type
        if current_step == 0:
            return "CON Register as:\n1. Client\n2. Employee"
        
        user_type = inputs[0]
        
        # Step 2: Enter first name
        if current_step == 1:
            return "CON Enter your first name:"
        
        first_name = inputs[1]
        
        # Step 3: Enter last name
        if current_step == 2:
            return "CON Enter your last name:"
        
        last_name = inputs[2]
        
        # Step 4: Enter email (optional)
        if current_step == 3:
            return "CON Enter your email (or press # to skip):"
        
        email = inputs[3] if inputs[3] != '#' else None
        
        # Check if user already exists
        if CustomUser.objects.filter(phone_number=phone_number).exists():
            user = CustomUser.objects.get(phone_number=phone_number)
            return f"END User already registered. Your PIN is: {user.ussd_pin}"
        
        # Create user
        try:
            user = CustomUser.objects.create_user(
                phone_number=phone_number,
                email=email,
                first_name=first_name,
                last_name=last_name,
                user_type='client' if user_type == '1' else 'employee'
            )
            
            # Generate USSD PIN
            pin = user.generate_ussd_pin()
            
            # Link transaction to user
            transaction.user = user
            transaction.save()
            
            return f"""END Registration successful!
Your PIN is: {pin}
Please save this PIN for future logins.
User Type: {user.user_type}"""
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return "END Registration failed. Please try again later."
    
    @staticmethod
    def handle_login(phone_number, inputs, transaction):
        """Handle user login flow"""
        current_step = len(inputs)
        
        # Step 1: Enter phone number
        if current_step == 0:
            return "CON Enter your phone number:"
        
        entered_phone = inputs[0]
        
        # Step 2: Enter PIN
        if current_step == 1:
            return "CON Enter your PIN:"
        
        entered_pin = inputs[1]
        
        # Verify user
        try:
            user = CustomUser.objects.get(phone_number=entered_phone)
            
            if user.verify_ussd_pin(entered_pin):
                transaction.user = user
                transaction.save()
                
                # Set session stage
                transaction.stage = f'logged_in_{user.user_type}'
                transaction.save()
                
                return USSDHandler.post_login_menu(user)
            else:
                return "END Invalid PIN. Please try again or register."
                
        except CustomUser.DoesNotExist:
            return "END User not found. Please register first."
    
    @staticmethod
    def post_login_menu(user):
        """Display menu after successful login"""
        if user.user_type == 'client':
            return USSDHandler.client_menu()
        elif user.user_type == 'employee':
            return USSDHandler.employee_menu()
        else:
            return USSDHandler.admin_menu()
    
    @staticmethod
    def client_menu():
        """Client services menu"""
        return """CON Client Services
1. Create Task
2. View My Tasks
3. Verify Task Completion
4. Rate Employee
5. View Transaction History
6. Main Menu"""
    
    @staticmethod
    def employee_menu():
        """Employee services menu"""
        return """CON Employee Services
1. View Available Tasks
2. Accept Task
3. Update Task Status
4. View Completed Tasks
5. View Earnings
6. Main Menu"""
    
    @staticmethod
    def admin_menu():
        """Admin services menu"""
        return """CON Admin Services
1. View All Users
2. View All Tasks
3. Generate Reports
4. Manage Disputes
5. System Settings
6. Main Menu"""
    
    @staticmethod
    def handle_client_menu(phone_number, inputs, transaction):
        """Handle client menu actions"""
        if not transaction.user:
            return "END Please login first"
        
        current_step = len(inputs)
        
        if current_step == 0:
            return USSDHandler.client_menu()
        
        action = inputs[0]
        
        if action == '1':  # Create Task
            return USSDHandler.create_task_flow(transaction.user, inputs[1:])
        
        elif action == '2':  # View My Tasks
            return USSDHandler.view_client_tasks(transaction.user)
        
        elif action == '3':  # Verify Task Completion
            return USSDHandler.verify_task(transaction.user, inputs[1:])
        
        elif action == '4':  # Rate Employee
            return USSDHandler.rate_employee(transaction.user, inputs[1:])
        
        elif action == '6':  # Main Menu
            transaction.stage = 'start'
            transaction.save()
            return USSDHandler.welcome_screen()
        
        return USSDHandler.error_screen()
    
    @staticmethod
    def handle_employee_menu(phone_number, inputs, transaction):
        """Handle employee menu actions"""
        if not transaction.user:
            return "END Please login first"
        
        current_step = len(inputs)
        
        if current_step == 0:
            return USSDHandler.employee_menu()
        
        action = inputs[0]
        
        if action == '1':  # View Available Tasks
            return USSDHandler.view_available_tasks()
        
        elif action == '2':  # Accept Task
            return USSDHandler.accept_task_flow(transaction.user, inputs[1:])
        
        elif action == '3':  # Update Task Status
            return USSDHandler.update_task_status(transaction.user, inputs[1:])
        
        elif action == '6':  # Main Menu
            transaction.stage = 'start'
            transaction.save()
            return USSDHandler.welcome_screen()
        
        return USSDHandler.error_screen()
    
    @staticmethod
    def create_task_flow(client, inputs):
        """Handle task creation flow"""
        current_step = len(inputs)
        
        if current_step == 0:
            return "CON Enter task title:"
        
        title = inputs[0]
        
        if current_step == 1:
            return "CON Enter task description:"
        
        description = inputs[1]
        
        if current_step == 2:
            return "CON Enter task budget (KSh):"
        
        try:
            price = float(inputs[2])
            
            # Create task
            task = Task.objects.create(
                client=client,
                title=title,
                description=description,
                price=price,
                status='pending'
            )
            
            return f"""END Task created successfully!
Task ID: {task.id}
Title: {task.title}
Budget: KSh {price}
Status: Pending"""
            
        except ValueError:
            return "END Invalid amount. Task creation cancelled."
    
    @staticmethod
    def view_client_tasks(client):
        """View client's tasks"""
        tasks = Task.objects.filter(client=client).order_by('-created_at')[:5]
        
        if not tasks:
            return "END You have no tasks yet."
        
        response = "CON Your Recent Tasks:\n"
        for task in tasks:
            response += f"{task.id}. {task.title} - {task.status}\n"
        response += "0. Back"
        
        return response
    
    @staticmethod
    def view_available_tasks():
        """View tasks available for employees"""
        tasks = Task.objects.filter(status='pending').order_by('-created_at')[:5]
        
        if not tasks:
            return "END No tasks available at the moment."
        
        response = "CON Available Tasks:\n"
        for task in tasks:
            response += f"{task.id}. {task.title} - KSh {task.price}\n"
        response += "0. Back"
        
        return response
    
    @staticmethod
    def accept_task_flow(employee, inputs):
        """Handle task acceptance by employee"""
        current_step = len(inputs)
        
        if current_step == 0:
            return "CON Enter Task ID to accept:"
        
        try:
            task_id = int(inputs[0])
            task = Task.objects.get(id=task_id, status='pending')
            
            task.employee = employee
            task.status = 'assigned'
            task.save()
            
            return f"END Task {task_id} accepted successfully!"
            
        except Task.DoesNotExist:
            return "END Task not found or already assigned."
        except ValueError:
            return "END Invalid Task ID."
    
    @staticmethod
    def verify_task(client, inputs):
        """Handle task verification by client"""
        current_step = len(inputs)
        
        if current_step == 0:
            tasks = Task.objects.filter(client=client, status='completed')
            if not tasks:
                return "END No tasks pending verification."
            
            response = "CON Select task to verify:\n"
            for task in tasks[:5]:
                response += f"{task.id}. {task.title}\n"
            return response
        
        try:
            task_id = int(inputs[0])
            task = Task.objects.get(id=task_id, client=client, status='completed')
            
            task.status = 'verified'
            task.verified_at = timezone.now()
            task.save()
            
            return f"END Task {task_id} verified successfully!"
            
        except Task.DoesNotExist:
            return "END Task not found or not completed."
    
    @staticmethod
    def rate_employee(client, inputs):
        """Handle employee rating by client"""
        current_step = len(inputs)
        
        if current_step == 0:
            tasks = Task.objects.filter(client=client, status='verified', employee_rating__isnull=True)
            if not tasks:
                return "END No tasks pending rating."
            
            response = "CON Select task to rate:\n"
            for task in tasks[:5]:
                response += f"{task.id}. {task.title} - Employee: {task.employee.first_name}\n"
            return response
        
        try:
            task_id = int(inputs[0])
            task = Task.objects.get(id=task_id, client=client)
            
            if current_step == 1:
                return "CON Rate employee (1-5 stars):"
            
            rating = int(inputs[1])
            if 1 <= rating <= 5:
                task.employee_rating = rating
                task.save()
                return f"END Thank you! Rated {rating} stars."
            else:
                return "END Rating must be between 1 and 5."
                
        except (Task.DoesNotExist, ValueError):
            return "END Invalid selection."
    
    @staticmethod
    def update_task_status(employee, inputs):
        """Handle task status update by employee"""
        current_step = len(inputs)
        
        if current_step == 0:
            tasks = Task.objects.filter(employee=employee, status='assigned')
            if not tasks:
                return "END No assigned tasks."
            
            response = "CON Select task to update:\n"
            for task in tasks[:5]:
                response += f"{task.id}. {task.title}\n"
            return response
        
        try:
            task_id = int(inputs[0])
            task = Task.objects.get(id=task_id, employee=employee)
            
            if current_step == 1:
                return """CON Update status:
1. In Progress
2. Completed
3. Issue Reported"""
            
            status_map = {
                '1': 'in_progress',
                '2': 'completed',
                '3': 'pending'
            }
            
            if inputs[1] in status_map:
                task.status = status_map[inputs[1]]
                if task.status == 'completed':
                    task.completed_at = timezone.now()
                task.save()
                
                return f"END Task status updated to: {task.status}"
            else:
                return "END Invalid option."
                
        except Task.DoesNotExist:
            return "END Task not found or not assigned to you."
    
    @staticmethod
    def error_screen():
        """Error screen"""
        return "END Invalid option. Please try again."


# Main USSD view
ussd_handler = USSDHandler()