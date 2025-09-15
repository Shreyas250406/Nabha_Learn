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
import { FileText, Users, BarChart3, Download, Plus } from 'lucide-react';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { InputWithTTS } from './InputWithTTS';
import { TextareaWithTTS } from './TextareaWithTTS';

interface Assignment {
  id: number;
  title: string;
  type: 'quiz' | 'written' | 'upload';
  standard: string;
  division: string;
  content?: string;
  created_at: Date;
}

interface BatchAnalytics {
  batches: {
    standard: string;
    division: string;
    student_count: number;
    students: {
      id: number;
      name: string;
      username: string;
      average_completion: number;
    }[];
  }[];
}

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batchAnalytics, setBatchAnalytics] = useState<BatchAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');

  // Assignment form state
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<'quiz' | 'written' | 'upload'>('quiz');
  const [assignmentStandard, setAssignmentStandard] = useState('');
  const [assignmentDivision, setAssignmentDivision] = useState('');
  const [assignmentContent, setAssignmentContent] = useState('');

  // Student form state
  const [studentName, setStudentName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentStandard, setStudentStandard] = useState('');
  const [studentDivision, setStudentDivision] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  useEffect(() => {
    loadAssignments();
    loadBatchAnalytics();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await backend.auth.getAllAssignments();
      setAssignments(response.assignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: t('error'),
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    }
  };

  const loadBatchAnalytics = async () => {
    try {
      const response = await backend.auth.getBatchAnalytics();
      setBatchAnalytics(response);
    } catch (error) {
      console.error('Error loading batch analytics:', error);
      toast({
        title: t('error'),
        description: 'Failed to load batch analytics',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await backend.auth.createAssignment({
        title: assignmentTitle,
        type: assignmentType,
        standard: assignmentStandard,
        division: assignmentDivision,
        content: assignmentContent || undefined,
        created_by: user.id
      });

      toast({
        title: t('success'),
        description: 'Assignment created successfully',
      });

      setAssignmentTitle('');
      setAssignmentContent('');
      setAssignmentStandard('');
      setAssignmentDivision('');
      loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: t('error'),
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await backend.auth.createStudentWithParent({
        student_name: studentName,
        student_username: studentUsername,
        student_phone: studentPhone,
        standard: studentStandard,
        division: studentDivision,
        parent_name: parentName,
        parent_phone: parentPhone
      });

      toast({
        title: t('success'),
        description: 'Student and parent accounts created successfully',
      });

      setStudentName('');
      setStudentUsername('');
      setStudentPhone('');
      setStudentStandard('');
      setStudentDivision('');
      setParentName('');
      setParentPhone('');
      loadBatchAnalytics();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: t('error'),
        description: 'Failed to create student account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportBatchData = async (standard: string, division: string) => {
    try {
      const batch = batchAnalytics?.batches.find(b => b.standard === standard && b.division === division);
      if (!batch) return;

      // Create CSV content
      const csvContent = [
        ['Name', 'Username', 'Average Completion %'],
        ...batch.students.map(student => [
          student.name,
          student.username,
          student.average_completion.toFixed(2)
        ])
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${standard}_${division}_progress.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: t('success'),
        description: 'Batch data exported successfully',
      });
    } catch (error) {
      console.error('Error exporting batch data:', error);
      toast({
        title: t('error'),
        description: 'Failed to export batch data',
        variant: 'destructive',
      });
    }
  };

  const standards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const divisions = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-green-50">
      <Header roleColor="green" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-green-100">
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{t('assignments')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{t('users')}</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>{t('analysis')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            {/* Create Assignment Form */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>{t('create_assignment')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={assignmentTitle}
                      onChange={setAssignmentTitle}
                      placeholder={t('placeholders.assignment_title')}
                      label={t('title')}
                      required
                    />
                    <div>
                      <Label htmlFor="assignmentType">{t('assignment_type')}</Label>
                      <Select value={assignmentType} onValueChange={(value: 'quiz' | 'written' | 'upload') => setAssignmentType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">{t('quiz')}</SelectItem>
                          <SelectItem value="written">{t('written')}</SelectItem>
                          <SelectItem value="upload">{t('upload')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignmentStandard">{t('standard')}</Label>
                      <Select value={assignmentStandard} onValueChange={setAssignmentStandard}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('standard')} />
                        </SelectTrigger>
                        <SelectContent>
                          {standards.map((std) => (
                            <SelectItem key={std} value={std}>{std}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignmentDivision">{t('division')}</Label>
                      <Select value={assignmentDivision} onValueChange={setAssignmentDivision}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('division')} />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div} value={div}>{div}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <TextareaWithTTS
                    value={assignmentContent}
                    onChange={setAssignmentContent}
                    placeholder="Assignment instructions or content"
                    label="Content/Instructions"
                    rows={4}
                  />
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? t('loading') : t('create')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="border-green-200 hover:border-green-300 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <div className="flex space-x-2 text-sm text-black">
                      <span className="bg-green-100 px-2 py-1 rounded">{assignment.type}</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">{assignment.standard}-{assignment.division}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignment.content && (
                      <p className="text-black mb-2">{assignment.content}</p>
                    )}
                    <p className="text-sm text-black">
                      Created: {new Date(assignment.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Register Student Form */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>{t('register_student')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={studentName}
                      onChange={setStudentName}
                      placeholder={t('name')}
                      label={t('name')}
                      required
                    />
                    <InputWithTTS
                      value={studentUsername}
                      onChange={setStudentUsername}
                      placeholder={t('username')}
                      label={t('username')}
                      required
                    />
                  </div>
                  <InputWithTTS
                    value={studentPhone}
                    onChange={setStudentPhone}
                    placeholder="1234567890"
                    label="Student Phone Number"
                    type="tel"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="studentStandard">{t('standard')}</Label>
                      <Select value={studentStandard} onValueChange={setStudentStandard}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('standard')} />
                        </SelectTrigger>
                        <SelectContent>
                          {standards.map((std) => (
                            <SelectItem key={std} value={std}>{std}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="studentDivision">{t('division')}</Label>
                      <Select value={studentDivision} onValueChange={setStudentDivision}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('division')} />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div} value={div}>{div}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWithTTS
                      value={parentName}
                      onChange={setParentName}
                      placeholder={t('parent_name')}
                      label={t('parent_name')}
                      required
                    />
                    <InputWithTTS
                      value={parentPhone}
                      onChange={setParentPhone}
                      placeholder="1234567890"
                      label="Parent Phone Number"
                      type="tel"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? t('loading') : t('create')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {/* Batch Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchAnalytics?.batches.map((batch) => (
                <Card key={`${batch.standard}-${batch.division}`} className="border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">
                      {t('standard')} {batch.standard}-{batch.division}
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => handleExportBatchData(batch.standard, batch.division)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{t('batch_strength')}:</span>
                        <span className="font-semibold">{batch.student_count}</span>
                      </div>
                      <div className="text-sm text-black">
                        <p className="font-medium mb-2">Students:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {batch.students.map((student) => (
                            <div key={student.id} className="flex justify-between text-xs text-black">
                              <span>{student.name}</span>
                              <span>{student.average_completion.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;
