import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, FileText, Clock, CheckCircle } from 'lucide-react';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Child {
  id: number;
  name: string;
  username: string;
  standard?: string;
  division?: string;
  course_progress: {
    course_id: number;
    course_title: string;
    progress_percentage: number;
  }[];
  pending_assignments: {
    assignment_id: number;
    assignment_title: string;
    assignment_type: string;
    created_at: Date;
  }[];
}

interface ParentDashboardData {
  children: Child[];
}

const ParentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Store data for offline access
    storeDataForOffline();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const response = await backend.auth.getParentDashboard({ parent_id: user.id });
      setDashboardData(response);
      
      // Store in localStorage for offline access
      localStorage.setItem('parent_dashboard', JSON.stringify(response));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Try to load from localStorage if offline
      const storedData = localStorage.getItem('parent_dashboard');
      if (storedData) {
        setDashboardData(JSON.parse(storedData));
      } else {
        toast({
          title: t('error'),
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const storeDataForOffline = () => {
    // Store timestamp for offline indicator
    localStorage.setItem('parent_last_sync', new Date().toISOString());
  };

  const isOnline = navigator.onLine;

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50">
        <Header roleColor="purple" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-lg">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <Header roleColor="purple" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Online/Offline Indicator */}
        <div className="mb-6 flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-black">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-2">{t('children_progress')}</h2>
          <p className="text-black">Track your children's learning progress and pending assignments</p>
        </div>

        {dashboardData?.children && dashboardData.children.length > 0 ? (
          <div className="space-y-8">
            {dashboardData.children.map((child) => (
              <Card key={child.id} className="border-purple-200 shadow-lg">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="text-xl font-bold">{child.name}</h3>
                      <p className="text-sm text-black">
                        {child.standard && child.division 
                          ? `${t('standard')} ${child.standard}-${child.division} • ${child.username}`
                          : child.username
                        }
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course Progress */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        <span>{t('course_progress')}</span>
                      </h4>
                      
                      {child.course_progress.length > 0 ? (
                        <div className="space-y-4">
                          {child.course_progress.map((progress) => (
                            <div key={progress.course_id} className="bg-purple-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="font-medium text-black">{progress.course_title}</h5>
                                <span className="text-sm font-semibold text-purple-600">
                                  {progress.progress_percentage.toFixed(0)}%
                                </span>
                              </div>
                              <Progress 
                                value={progress.progress_percentage} 
                                className="w-full" 
                              />
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-black">
                                  {progress.progress_percentage >= 100 ? t('completed') : 'In Progress'}
                                </span>
                                {progress.progress_percentage >= 100 && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-black">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No course progress available</p>
                        </div>
                      )}
                    </div>

                    {/* Pending Assignments */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span>{t('pending_assignments')}</span>
                      </h4>
                      
                      {child.pending_assignments.length > 0 ? (
                        <div className="space-y-3">
                          {child.pending_assignments.map((assignment) => (
                            <div key={assignment.assignment_id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-black">{assignment.assignment_title}</h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="bg-yellow-200 px-2 py-1 rounded text-xs font-medium">
                                      {assignment.assignment_type}
                                    </span>
                                    <div className="flex items-center space-x-1 text-xs text-black">
                                      <Clock className="h-3 w-3" />
                                      <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {t('pending')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-black">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                          <p>All assignments completed!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-8 pt-6 border-t border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {child.course_progress.length}
                        </div>
                        <div className="text-sm text-black">Courses Enrolled</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {child.course_progress.filter(p => p.progress_percentage >= 100).length}
                        </div>
                        <div className="text-sm text-black">Courses Completed</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {child.pending_assignments.length}
                        </div>
                        <div className="text-sm text-black">Pending Assignments</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-black mb-2">No Children Found</h3>
            <p className="text-black">
              No student accounts are linked to your parent account yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
