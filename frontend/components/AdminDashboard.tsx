import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreVertical, Users, BookOpen, BarChart3, Download, Plus, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { InputWithTTS } from './InputWithTTS';
import { TextareaWithTTS } from './TextareaWithTTS';

interface Course {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  file_path?: string;
  file_type?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  phone_number: string;
  created_at: Date;
}

interface Analytics {
  total_students: number;
  total_teachers: number;
  total_logins_this_week: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // Course form state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // User creation form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<'teacher' | 'admin'>('teacher');

  useEffect(() => {
    loadCourses();
    loadTeachers();
    loadAdmins();
    loadAnalytics();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await backend.auth.getCourses();
      setCourses(response.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: t('error'),
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await backend.auth.getUsersByRole({ role: 'teacher' });
      setTeachers(response.users);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast({
        title: t('error'),
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await backend.auth.getUsersByRole({ role: 'admin' });
      setAdmins(response.users);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: t('error'),
        description: 'Failed to load admins',
        variant: 'destructive',
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await backend.auth.getAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: t('error'),
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // For simplicity, we'll store the file name
      // In a real app, you'd upload to object storage first
      const filePath = selectedFile ? selectedFile.name : undefined;
      const fileType = selectedFile ? selectedFile.type : undefined;

      await backend.auth.createCourse({
        title: courseTitle,
        description: courseDescription || undefined,
        duration: courseDuration || undefined,
        file_path: filePath,
        file_type: fileType,
        created_by: user.id
      });

      toast({
        title: t('success'),
        description: 'Course created successfully',
      });

      setCourseTitle('');
      setCourseDescription('');
      setCourseDuration('');
      setSelectedFile(null);
      loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: t('error'),
        description: 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await backend.auth.createUser({
        username: userEmail.split('@')[0] || userName.toLowerCase().replace(/\s+/g, '_'),
        name: userName,
        email: userEmail,
        phone_number: userPhone,
        role: userRole
      });

      toast({
        title: t('success'),
        description: `${userRole === 'admin' ? 'Admin' : 'Teacher'} created successfully. Phone: ${response.phone_number}`,
      });

      setUserName('');
      setUserEmail('');
      setUserPhone('');
      setUserRole('teacher');
      loadTeachers();
      loadAdmins();
    } catch (error) {
      console.error(`Error creating ${userRole}:`, error);
      toast({
        title: t('error'),
        description: `Failed to create ${userRole}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await backend.auth.deleteCourse({ id: courseId });
      toast({
        title: t('success'),
        description: 'Course deleted successfully',
      });
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: t('error'),
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDescription(course.description || '');
    setCourseDuration(course.duration || '');
    setSelectedFile(null);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setLoading(true);
    try {
      const filePath = selectedFile ? selectedFile.name : editingCourse.file_path;
      const fileType = selectedFile ? selectedFile.type : editingCourse.file_type;

      await backend.auth.updateCourse({
        id: editingCourse.id,
        title: courseTitle,
        description: courseDescription || undefined,
        duration: courseDuration || undefined,
        file_path: filePath,
        file_type: fileType,
      });

      toast({
        title: t('success'),
        description: 'Course updated successfully',
      });

      setEditingCourse(null);
      setCourseTitle('');
      setCourseDescription('');
      setCourseDuration('');
      setSelectedFile(null);
      loadCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: t('error'),
        description: 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseDescription('');
    setCourseDuration('');
    setSelectedFile(null);
  };

  const handleExportData = async () => {
    try {
      const response = await backend.auth.getStudentProgress();
      
      // Create CSV content
      const csvContent = [
        ['Name', 'Username', 'Standard', 'Division', 'Average Completion %'],
        ...response.students.map(student => [
          student.name,
          student.username,
          student.standard || '',
          student.division || '',
          student.average_completion.toFixed(2)
        ])
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_progress.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: t('success'),
        description: 'Data exported successfully',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: t('error'),
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header roleColor="orange" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-orange-100">
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>{t('courses')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{t('users')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>{t('analytics')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Create/Edit Course Form */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>{editingCourse ? 'Edit Course' : t('create_course')}</span>
                  </div>
                  {editingCourse && (
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={courseTitle}
                      onChange={setCourseTitle}
                      placeholder={t('placeholders.course_title')}
                      label={t('title')}
                      required
                    />
                    <InputWithTTS
                      value={courseDuration}
                      onChange={setCourseDuration}
                      placeholder="e.g., 2 weeks"
                      label={t('duration')}
                    />
                  </div>
                  <TextareaWithTTS
                    value={courseDescription}
                    onChange={setCourseDescription}
                    placeholder={t('description')}
                    label={t('description')}
                    rows={3}
                  />
                  <div>
                    <Label htmlFor="courseFile">{t('file_upload')}</Label>
                    <Input
                      id="courseFile"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.mp4,.avi,.mov,.docx,.pptx"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                    {loading ? t('loading') : (editingCourse ? 'Update' : t('create'))}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Courses List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="border-orange-200 hover:border-orange-300 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    {course.description && (
                      <p className="text-black mb-2">{course.description}</p>
                    )}
                    {course.duration && (
                      <p className="text-sm text-black mb-2">Duration: {course.duration}</p>
                    )}
                    {course.file_path && (
                      <p className="text-sm text-blue-600">📁 {course.file_path}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Create User Form */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create User</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={userName}
                      onChange={setUserName}
                      placeholder={t('name')}
                      label={t('name')}
                      required
                    />
                    <InputWithTTS
                      value={userEmail}
                      onChange={setUserEmail}
                      placeholder={t('email')}
                      label={t('email')}
                      type="email"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={userPhone}
                      onChange={setUserPhone}
                      placeholder="+1234567890"
                      label="Phone Number"
                      type="tel"
                      required
                    />
                    <div>
                      <Label htmlFor="userRole">Role</Label>
                      <Select value={userRole} onValueChange={(value: 'teacher' | 'admin') => setUserRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                    {loading ? t('loading') : `Create ${userRole === 'admin' ? 'Admin' : 'Teacher'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Teachers List */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Registered Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-black">{teacher.name}</h4>
                        <p className="text-sm text-black">{teacher.email}</p>
                        <p className="text-xs text-black">Phone: {teacher.phone_number}</p>
                        <p className="text-xs text-black">Username: {teacher.username}</p>
                      </div>
                      <div className="text-sm text-black">
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {teachers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No teachers registered yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admins List */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Registered Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-black">{admin.name}</h4>
                        <p className="text-sm text-black">{admin.email}</p>
                        <p className="text-xs text-black">Phone: {admin.phone_number}</p>
                        <p className="text-xs text-black">Username: {admin.username}</p>
                      </div>
                      <div className="text-sm text-black">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {admins.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No admins registered yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('total_students')}</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_students || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('total_teachers')}</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_teachers || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('weekly_logins')}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_logins_this_week || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>{t('export_data')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportData} className="bg-orange-600 hover:bg-orange-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Student Progress
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
