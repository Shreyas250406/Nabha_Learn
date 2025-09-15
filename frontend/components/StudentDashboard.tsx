import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, Upload, CheckCircle, Clock } from 'lucide-react';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { TTSButton } from './TTSButton';
import { TextareaWithTTS } from './TextareaWithTTS';

interface Course {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  file_path?: string;
  file_type?: string;
  created_at: Date;
}

interface Assignment {
  id: number;
  title: string;
  type: 'quiz' | 'written' | 'upload';
  content?: string;
  created_at: Date;
}

interface CourseProgress {
  course_id: number;
  course_title: string;
  progress_percentage: number;
  completed_at?: Date;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // Assignment submission state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  useEffect(() => {
    loadCourses();
    loadAssignments();
    loadCourseProgress();
    
    // Store data for offline access
    storeDataForOffline();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await backend.auth.getCourses();
      setCourses(response.courses);
      
      // Store in localStorage for offline access
      localStorage.setItem('student_courses', JSON.stringify(response.courses));
    } catch (error) {
      console.error('Error loading courses:', error);
      
      // Try to load from localStorage if offline
      const storedCourses = localStorage.getItem('student_courses');
      if (storedCourses) {
        setCourses(JSON.parse(storedCourses));
      } else {
        toast({
          title: t('common.error'),
          description: 'Failed to load courses',
          variant: 'destructive',
        });
      }
    }
  };

  const loadAssignments = async () => {
    if (!user?.standard || !user?.division) return;

    try {
      const response = await backend.auth.getAssignmentsByClass({
        standard: user.standard,
        division: user.division
      });
      setAssignments(response.assignments);
      
      // Store in localStorage for offline access
      localStorage.setItem('student_assignments', JSON.stringify(response.assignments));
    } catch (error) {
      console.error('Error loading assignments:', error);
      
      // Try to load from localStorage if offline
      const storedAssignments = localStorage.getItem('student_assignments');
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      } else {
        toast({
          title: t('common.error'),
          description: 'Failed to load assignments',
          variant: 'destructive',
        });
      }
    }
  };

  const loadCourseProgress = async () => {
    if (!user) return;

    try {
      const response = await backend.auth.getStudentCourseProgress({ student_id: user.id });
      setCourseProgress(response.progress);
      
      // Store in localStorage for offline access
      localStorage.setItem('student_progress', JSON.stringify(response.progress));
    } catch (error) {
      console.error('Error loading course progress:', error);
      
      // Try to load from localStorage if offline
      const storedProgress = localStorage.getItem('student_progress');
      if (storedProgress) {
        setCourseProgress(JSON.parse(storedProgress));
      }
    }
  };

  const storeDataForOffline = () => {
    // Store timestamp for offline indicator
    localStorage.setItem('last_sync', new Date().toISOString());
  };

  const handleCourseProgress = async (courseId: number, newProgress: number) => {
    if (!user) return;

    try {
      await backend.auth.updateCourseProgress({
        course_id: courseId,
        student_id: user.id,
        progress_percentage: newProgress
      });

      // Update local state
      setCourseProgress(prev => {
        const existing = prev.find(p => p.course_id === courseId);
        if (existing) {
          return prev.map(p => p.course_id === courseId ? { ...p, progress_percentage: newProgress } : p);
        } else {
          const course = courses.find(c => c.id === courseId);
          return [...prev, {
            course_id: courseId,
            course_title: course?.title || '',
            progress_percentage: newProgress
          }];
        }
      });

      toast({
        title: t('common.success'),
        description: 'Progress updated successfully',
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update progress. Will sync when online.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAssignment) return;

    // Check if we're online
    if (!navigator.onLine) {
      toast({
        title: t('common.error'),
        description: 'Internet connection required to submit assignments',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // For file uploads, store the file name (in a real app, upload to object storage first)
      const filePath = submissionFile ? submissionFile.name : undefined;

      await backend.auth.submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        content: submissionContent || undefined,
        file_path: filePath
      });

      toast({
        title: t('common.success'),
        description: 'Assignment submitted successfully',
      });

      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      setSubmissionContent('');
      setSubmissionFile(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCourseProgress = (courseId: number) => {
    return courseProgress.find(p => p.course_id === courseId)?.progress_percentage || 0;
  };

  const isOnline = navigator.onLine;

  return (
    <div className="min-h-screen bg-blue-50">
      <Header roleColor="blue" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Online/Offline Indicator */}
        <div className="mb-4 flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-black">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-blue-100">
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>{t('dashboard.student.courses')}</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{t('dashboard.student.assignments')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const progress = getCourseProgress(course.id);
                return (
                  <Card key={course.id} className="border-blue-200 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <TTSButton text={course.title} />
                      </div>
                      {course.duration && (
                        <p className="text-sm text-black">Duration: {course.duration}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {course.description && (
                        <div className="flex items-start space-x-2">
                          <p className="text-black flex-1">{course.description}</p>
                          <TTSButton text={course.description} />
                        </div>
                      )}
                      
                      {course.file_path && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <FileText className="h-4 w-4" />
                          <span>{course.file_path}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('dashboard.student.progress')}</span>
                          <span className="text-sm text-black">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleCourseProgress(course.id, Math.min(progress + 25, 100))}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={progress >= 100}
                        >
                          {progress >= 100 ? t('common.success') : 'Study'}
                        </Button>
                        {progress >= 100 && (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="border-blue-200 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 px-2 py-1 rounded text-sm">{assignment.type}</span>
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-black">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignment.content && (
                      <p className="text-black">{assignment.content}</p>
                    )}
                    
                    <Button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmissionModal(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!isOnline}
                    >
                      {isOnline ? t('common.save') : 'Requires Internet'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {t('common.save')} - {selectedAssignment.title}
            </h3>
            
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              {selectedAssignment.type === 'written' && (
                <TextareaWithTTS
                  value={submissionContent}
                  onChange={setSubmissionContent}
                  placeholder={t('placeholders.answer')}
                  label="Your Answer"
                  rows={6}
                  required
                />
              )}

              {selectedAssignment.type === 'quiz' && (
                <TextareaWithTTS
                  value={submissionContent}
                  onChange={setSubmissionContent}
                  placeholder="Enter your answers..."
                  label="Your Response"
                  rows={4}
                  required
                />
              )}

              {selectedAssignment.type === 'upload' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Upload File</label>
                  <Input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    required
                  />
                  {submissionFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {submissionFile.name}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedAssignment(null);
                    setSubmissionContent('');
                    setSubmissionFile(null);
                  }}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
