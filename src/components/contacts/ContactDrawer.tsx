'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2, Mail, Phone, Building2, Briefcase, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createContact, updateContact, deleteContact } from './api';
import type { Contact } from './types';

const contactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  contact?: Contact | null;
  onSuccess?: () => void;
}

export function ContactDrawer({
  open,
  onClose,
  mode,
  contact,
  onSuccess,
}: ContactDrawerProps) {
  const [currentMode, setCurrentMode] = React.useState(mode);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    setCurrentMode(mode);
    if (contact) {
      reset({
        fullName: contact.fullName,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        notes: contact.notes || '',
      });
    } else {
      reset({ fullName: '', email: '', phone: '', company: '', title: '', notes: '' });
    }
  }, [contact, mode, reset]);

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        company: values.company || undefined,
        title: values.title || undefined,
        notes: values.notes || undefined,
      };

      if (currentMode === 'create' || !contact) {
        await createContact(payload);
        toast.success('Contact created');
      } else {
        await updateContact(contact.id, payload);
        toast.success('Contact updated');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteContact(contact.id);
      toast.success('Contact deleted');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const isView = currentMode === 'view';
  const title =
    currentMode === 'create'
      ? 'New Contact'
      : currentMode === 'edit'
      ? 'Edit Contact'
      : contact?.fullName || 'Contact';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md busala-card border-0 p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between p-4 pb-3 border-b" style={{ borderColor: 'var(--busala-border-divider)' }}>
          <DialogTitle className="text-base font-semibold text-busala-text-primary">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {isView && contact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMode('edit')}
                className="h-8 px-3 text-xs text-busala-text-muted hover:text-busala-text-primary"
              >
                Edit
              </Button>
            )}
            {!isView && contact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`h-8 w-8 ${deleteConfirm ? 'text-red-500 hover:text-red-600' : 'text-busala-text-muted hover:text-red-500'}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-busala-text-muted hover:text-busala-text-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Body */}
        {isView && contact ? (
          <div className="p-4 space-y-3">
            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-busala-text-subtle mt-0.5 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-busala-primary hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-busala-text-subtle mt-0.5 shrink-0" />
                <span className="text-sm text-busala-text-primary">{contact.phone}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-busala-text-subtle mt-0.5 shrink-0" />
                <span className="text-sm text-busala-text-primary">{contact.company}</span>
              </div>
            )}
            {contact.title && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 text-busala-text-subtle mt-0.5 shrink-0" />
                <span className="text-sm text-busala-text-primary">{contact.title}</span>
              </div>
            )}
            {contact.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-busala-text-subtle mt-0.5 shrink-0" />
                <p className="text-sm text-busala-text-primary whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
            <div className="pt-2">
              <Button
                onClick={() => setCurrentMode('edit')}
                className="w-full h-9 text-sm font-medium text-[#0B0D10] rounded-lg busala-gradient-gold hover:opacity-90"
              >
                Edit Contact
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-busala-text-subtle">
                Full Name *
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Jane Smith"
                className="busala-input"
              />
              {errors.fullName && (
                <p className="text-xs text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-busala-text-subtle">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="jane@example.com"
                className="busala-input"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-busala-text-subtle">
                  Phone
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 555 0100"
                  className="busala-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-busala-text-subtle">
                  Title
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="CEO"
                  className="busala-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs text-busala-text-subtle">
                Company
              </Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Acme Corp"
                className="busala-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-busala-text-subtle">
                Notes
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional notes..."
                className="busala-input resize-none"
                rows={3}
              />
            </div>

            {deleteConfirm && (
              <p className="text-xs text-red-400 text-center">
                Click the trash icon again to confirm deletion
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-9 text-sm border-busala-border-divider text-busala-text-muted hover:text-busala-text-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-9 text-sm font-medium text-[#0B0D10] rounded-lg busala-gradient-gold hover:opacity-90"
              >
                {isSubmitting
                  ? currentMode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : currentMode === 'create'
                  ? 'Create Contact'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
