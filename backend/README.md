API endpoints
POST /api/auth/register/ - User registration
POST /api/auth/login/ - User login
POST /api/ussd/register-callback/ - USSD registration callback
GET /api/jobs/ - List job listings
POST /api/jobs/ - Create job listing
GET /api/jobs/{id}/ - Get job details
PATCH /api/jobs/{id}/ - Update job (assign employee)
POST /api/jobs/{id}/complete/ - Complete work and release payment
POST /api/callbacks/mpesa/deposit/ - M-Pesa deposit callback
Next steps
Run migrations: python manage.py makemigrations && python manage.py migrate
