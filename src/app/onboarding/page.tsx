'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Users2, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Clock
} from 'lucide-react';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Organization
    organizationName: '',
    timezone: 'America/New_York',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultLessonDuration: 60,
    
    // Step 2: Teachers
    teachers: [{ name: '', email: '', subjects: '' }],
    
    // Step 3: Students
    students: [{ name: '', grade: '' }],
    
    // Step 4: Groups
    groups: [{ name: '', subject: '' }],
    
    // Step 5: First Lesson
    firstLesson: {
      teacherId: '',
      groupId: '',
      date: '',
      time: '',
      roomId: '',
    },
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  async function handleNext() {
    if (currentStep < TOTAL_STEPS) {
      // Save progress to API (optional)
      await saveProgress(currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function saveProgress(step: number) {
    // TODO: Save progress to API
    console.log('Saving progress:', step);
  }

  async function completeOnboarding() {
    setIsLoading(true);
    // TODO: Submit all data and mark onboarding as complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    router.push('/dashboard');
  }

  function handleSkip() {
    // Skip current step
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <span className="text-slate-950 font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-white">ClassHub</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome! Let&apos;s set up your school</h1>
          <p className="text-slate-400">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>

        {/* Step Content */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <StepHeader step={currentStep} />
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <Step1Organization formData={formData} setFormData={setFormData} />}
            {currentStep === 2 && <Step2Teachers formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <Step3Students formData={formData} setFormData={setFormData} />}
            {currentStep === 4 && <Step4Groups formData={formData} setFormData={setFormData} />}
            {currentStep === 5 && <Step5FirstLesson formData={formData} setFormData={setFormData} />}
            {currentStep === 6 && <Step6Complete />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                {currentStep > 1 && currentStep < TOTAL_STEPS && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="text-slate-500"
                  >
                    Skip for now
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  {isLoading ? (
                    'Saving...'
                  ) : currentStep === TOTAL_STEPS ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

function StepHeader({ step }: { step: number }) {
  const steps = [
    { title: 'Organization Setup', description: 'Tell us about your school', icon: Building2 },
    { title: 'Add Teachers', description: 'Add your first teachers (up to 3)', icon: Users },
    { title: 'Add Students', description: 'Add your first students (up to 5)', icon: GraduationCap },
    { title: 'Create a Group', description: 'Set up your first class or group', icon: Users2 },
    { title: 'Schedule First Lesson', description: 'Create your first lesson', icon: Calendar },
    { title: 'All Set!', description: 'You\'re ready to go', icon: CheckCircle2 },
  ];

  const current = steps[step - 1];
  const Icon = current.icon;

  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <CardTitle className="text-xl text-white">{current.title}</CardTitle>
        <CardDescription className="text-slate-400">{current.description}</CardDescription>
      </div>
    </div>
  );
}

function Step1Organization({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-slate-300">Organization Name</Label>
        <Input
          value={formData.organizationName}
          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
          placeholder="e.g., Cairo Academy"
          className="bg-slate-950 border-slate-800 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Logo</Label>
        <div className="border-2 border-dashed border-slate-800 rounded-lg p-8 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Click to upload or drag and drop</p>
          <p className="text-xs text-slate-600 mt-1">PNG, JPG up to 2MB</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Timezone</Label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Dubai">Dubai (GST)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Working Days</Label>
        <div className="flex gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <button
              key={i}
              onClick={() => {
                const newDays = formData.workingDays.includes(i)
                  ? formData.workingDays.filter((d: number) => d !== i)
                  : [...formData.workingDays, i];
                setFormData({ ...formData, workingDays: newDays });
              }}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                formData.workingDays.includes(i)
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Default Lesson Duration</Label>
        <div className="flex gap-3">
          {[45, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => setFormData({ ...formData, defaultLessonDuration: mins })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                formData.defaultLessonDuration === mins
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Teachers({ formData, setFormData }: { formData: any, setFormData: any }) {
  const addTeacher = () => {
    if (formData.teachers.length < 3) {
      setFormData({
        ...formData,
        teachers: [...formData.teachers, { name: '', email: '', subjects: '' }],
      });
    }
  };

  const updateTeacher = (index: number, field: string, value: string) => {
    const newTeachers = [...formData.teachers];
    newTeachers[index][field] = value;
    setFormData({ ...formData, teachers: newTeachers });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Add up to 3 teachers. You can add more later from the Teachers page.
      </p>

      {formData.teachers.map((teacher: any, index: number) => (
        <div key={index} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Teacher {index + 1}</span>
          </div>
          <Input
            value={teacher.name}
            onChange={(e) => updateTeacher(index, 'name', e.target.value)}
            placeholder="Full Name"
            className="bg-slate-900 border-slate-800 text-white"
          />
          <Input
            value={teacher.email}
            onChange={(e) => updateTeacher(index, 'email', e.target.value)}
            placeholder="Email"
            type="email"
            className="bg-slate-900 border-slate-800 text-white"
          />
          <Input
            value={teacher.subjects}
            onChange={(e) => updateTeacher(index, 'subjects', e.target.value)}
            placeholder="Subjects (comma separated)"
            className="bg-slate-900 border-slate-800 text-white"
          />
        </div>
      ))}

      {formData.teachers.length < 3 && (
        <Button
          type="button"
          variant="outline"
          onClick={addTeacher}
          className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
        >
          + Add Another Teacher
        </Button>
      )}
    </div>
  );
}

function Step3Students({ formData, setFormData }: { formData: any, setFormData: any }) {
  const addStudent = () => {
    if (formData.students.length < 5) {
      setFormData({
        ...formData,
        students: [...formData.students, { name: '', grade: '' }],
      });
    }
  };

  const updateStudent = (index: number, field: string, value: string) => {
    const newStudents = [...formData.students];
    newStudents[index][field] = value;
    setFormData({ ...formData, students: newStudents });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Add up to 5 students. You can add more later from the Students page.
      </p>

      {formData.students.map((student: any, index: number) => (
        <div key={index} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Student {index + 1}</span>
          </div>
          <Input
            value={student.name}
            onChange={(e) => updateStudent(index, 'name', e.target.value)}
            placeholder="Full Name"
            className="bg-slate-900 border-slate-800 text-white"
          />
          <Input
            value={student.grade}
            onChange={(e) => updateStudent(index, 'grade', e.target.value)}
            placeholder="Grade/Level"
            className="bg-slate-900 border-slate-800 text-white"
          />
        </div>
      ))}

      {formData.students.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={addStudent}
          className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
        >
          + Add Another Student
        </Button>
      )}
    </div>
  );
}

function Step4Groups({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Create your first group or class. You can create more groups later.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Group Name</Label>
          <Input
            placeholder="e.g., Arabic Beginners A1"
            className="bg-slate-950 border-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Subject</Label>
          <Input
            placeholder="e.g., Arabic Language"
            className="bg-slate-950 border-slate-800 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Teacher</Label>
          <select className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm">
            <option value="">Select a teacher...</option>
            {formData.teachers.map((t: any, i: number) => (
              <option key={i} value={i}>{t.name || `Teacher ${i + 1}`}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Students</Label>
          <div className="space-y-2">
            {formData.students.map((s: any, i: number) => (
              <label key={i} className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-amber-500" />
                {s.name || `Student ${i + 1}`}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5FirstLesson({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Schedule your first lesson. This helps you see how the calendar works.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Teacher</Label>
          <select className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm">
            <option value="">Select teacher...</option>
            {formData.teachers.map((t: any, i: number) => (
              <option key={i} value={i}>{t.name || `Teacher ${i + 1}`}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Group</Label>
          <select className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm">
            <option value="">Select group...</option>
            <option value="1">Arabic Beginners A1</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Date</Label>
            <Input
              type="date"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Time</Label>
            <Input
              type="time"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
        </div>

        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">No conflicts detected</p>
              <p className="text-xs text-green-500/70">This time slot is available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step6Complete() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        You&apos;re all set!
      </h3>
      <p className="text-slate-400 mb-6">
        Your school is ready. Here&apos;s what you can do next:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <Calendar className="h-5 w-5 text-amber-500 mb-2" />
          <p className="font-medium text-white">View Schedule</p>
          <p className="text-sm text-slate-400">See your lessons on the calendar</p>
        </div>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <Users className="h-5 w-5 text-amber-500 mb-2" />
          <p className="font-medium text-white">Add More Teachers</p>
          <p className="text-sm text-slate-400">Build your teaching team</p>
        </div>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <GraduationCap className="h-5 w-5 text-amber-500 mb-2" />
          <p className="font-medium text-white">Enroll Students</p>
          <p className="text-sm text-slate-400">Add students to your groups</p>
        </div>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <Clock className="h-5 w-5 text-amber-500 mb-2" />
          <p className="font-medium text-white">Schedule Lessons</p>
          <p className="text-sm text-slate-400">Plan your upcoming classes</p>
        </div>
      </div>
    </div>
  );
}
