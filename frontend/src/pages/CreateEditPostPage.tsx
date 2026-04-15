import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { mockPosts, domainOptions, stageOptions, collaborationTypes, confidentialityLevels, commitmentLevels, expertiseOptions } from '@/data/mockData';
import { ArrowLeft } from 'lucide-react';

const CreateEditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? mockPosts.find(p => p.id === id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title || '',
    workingDomain: existing?.workingDomain || '',
    shortExplanation: existing?.shortExplanation || '',
    requiredExpertise: existing?.requiredExpertise || [] as string[],
    projectStage: existing?.projectStage || '',
    collaborationType: existing?.collaborationType || '',
    confidentialityLevel: existing?.confidentialityLevel || '',
    country: existing?.country || '',
    city: existing?.city || '',
    commitmentLevel: existing?.commitmentLevel || '',
    highLevelIdea: existing?.highLevelIdea || '',
    expiryDate: existing?.expiryDate || '',
    autoClose: existing?.autoClose || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleExpertise = (tag: string) => {
    setForm(f => ({
      ...f,
      requiredExpertise: f.requiredExpertise.includes(tag)
        ? f.requiredExpertise.filter(t => t !== tag)
        : [...f.requiredExpertise, tag],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.workingDomain) e.workingDomain = 'Domain is required';
    if (!form.shortExplanation.trim()) e.shortExplanation = 'Explanation is required';
    if (form.requiredExpertise.length === 0) e.requiredExpertise = 'Select at least one expertise';
    if (!form.projectStage) e.projectStage = 'Stage is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.country.trim()) e.country = 'Country is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (publish: boolean) => {
    if (!validate()) return;
    toast({
      title: publish ? 'Post published!' : isEdit ? 'Post updated!' : 'Draft saved!',
      description: publish ? 'Your post is now visible to all users.' : isEdit ? 'Changes saved successfully.' : 'You can publish it later.',
    });
    navigate('/my-posts');
  };

  const Field = ({ id, label, error, helperText, children }: { id: string; label: string; error?: string; helperText?: string; children: React.ReactNode }) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {helperText && <p className="text-xs text-muted-foreground mt-0.5 mb-1">{helperText}</p>}
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-xl font-semibold mb-6">{isEdit ? 'Edit Post' : 'Create New Post'}</h1>

        <div className="space-y-8">
          {/* Basic Info */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold mb-2">Basic Information</h2>
            <Field id="title" label="Title" error={errors.title} helperText="A clear, descriptive title for your collaboration opportunity.">
              <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g., Cardiology AI Assistant for ECG Interpretation" />
            </Field>
            <Field id="workingDomain" label="Working Domain" error={errors.workingDomain}>
              <Select value={form.workingDomain} onValueChange={v => update('workingDomain', v)}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>{domainOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field id="shortExplanation" label="Short Explanation" error={errors.shortExplanation} helperText="Briefly describe what you're looking for.">
              <Textarea id="shortExplanation" value={form.shortExplanation} onChange={e => update('shortExplanation', e.target.value)} rows={3} />
            </Field>
          </section>

          {/* Expertise */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-2">Required Expertise</h2>
            <p className="text-xs text-muted-foreground mb-3">Select the skills you need in a collaborator.</p>
            <div className="flex flex-wrap gap-2">
              {expertiseOptions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleExpertise(tag)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    form.requiredExpertise.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:bg-muted'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.requiredExpertise && <p className="text-xs text-destructive mt-2">{errors.requiredExpertise}</p>}
          </section>

          {/* Details */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold mb-2">Project Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field id="projectStage" label="Project Stage" error={errors.projectStage}>
                <Select value={form.projectStage} onValueChange={v => update('projectStage', v)}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>{stageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="collaborationType" label="Collaboration Type">
                <Select value={form.collaborationType} onValueChange={v => update('collaborationType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{collaborationTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="confidentialityLevel" label="Confidentiality Level">
                <Select value={form.confidentialityLevel} onValueChange={v => update('confidentialityLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{confidentialityLevels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="commitmentLevel" label="Commitment Level">
                <Select value={form.commitmentLevel} onValueChange={v => update('commitmentLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{commitmentLevels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold mb-2">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field id="city" label="City" error={errors.city}>
                <Input id="city" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Ankara" />
              </Field>
              <Field id="country" label="Country" error={errors.country}>
                <Input id="country" value={form.country} onChange={e => update('country', e.target.value)} placeholder="Turkey" />
              </Field>
            </div>
          </section>

          {/* High Level Idea */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold mb-2">High-Level Idea</h2>
            <Field id="highLevelIdea" label="Describe Your Idea" helperText="Share the big picture. Detailed discussions happen during meetings.">
              <Textarea id="highLevelIdea" value={form.highLevelIdea} onChange={e => update('highLevelIdea', e.target.value)} rows={4} />
            </Field>
          </section>

          {/* Expiry */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold mb-2">Post Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field id="expiryDate" label="Expiry Date">
                <Input id="expiryDate" type="date" value={form.expiryDate} onChange={e => update('expiryDate', e.target.value)} />
              </Field>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="autoClose" checked={form.autoClose} onCheckedChange={c => update('autoClose', !!c)} />
                  <Label htmlFor="autoClose" className="text-sm">Auto-close when partner found</Label>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => handleSave(false)}>Save as Draft</Button>
            <Button onClick={() => handleSave(true)}>Publish</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateEditPostPage;
