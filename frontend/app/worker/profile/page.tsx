'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, MapPin, Briefcase, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getToken, getUser } from '@/lib/auth';

export default function WorkerProfilePage() {
  const router = useRouter();
  const user = getUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
    hourlyRate: '',
  });

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone_number || '',
        location: '',
        bio: '',
        skills: '',
        experience: '',
        hourlyRate: '',
      });
    }
  }, [router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // TODO: Implement API call to update worker profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Update your bio data and professional information"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      <Card gradient hover>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-[#7B3FF2]" />
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                type="text"
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-[#00A8E8]" />
              Contact Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="tel"
                label="Phone Number"
                placeholder="254 700 000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="mt-4">
              <Input
                type="text"
                label="Location"
                placeholder="Nairobi, Kenya"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-[#006B3F]" />
              Professional Information
            </h3>
            <div className="space-y-4">
              <Textarea
                label="Bio"
                placeholder="Tell employers about yourself, your experience, and what makes you a great worker..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
              <Textarea
                label="Skills"
                placeholder="List your skills (e.g., Cleaning, Cooking, Childcare, Gardening, etc.)"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                rows={3}
              />
              <Input
                type="text"
                label="Years of Experience"
                placeholder="e.g., 5 years"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
              <Input
                type="number"
                label="Hourly Rate (KES)"
                placeholder="500"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="stellar"
              className="flex-1"
              isLoading={isLoading}
            >
              Save Profile
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/worker/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
