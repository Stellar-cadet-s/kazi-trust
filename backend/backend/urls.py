
from django.contrib import admin
from django.urls import path,include
    path('api/', include('users.urls')),

urlpatterns = [
    path('admin/', admin.site.urls),
        path('api/', include('product.urls')),

]
