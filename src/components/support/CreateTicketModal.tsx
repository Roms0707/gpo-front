import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, LifeBuoy, Send, Trophy, Paperclip, File, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createSupportTicket } from '../../services/api';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId?: string;
  tournamentName?: string;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  tournamentName
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pre-fill subject if tournament is provided
  useEffect(() => {
    if (tournamentName) {
      setSubject(`${t('support.tournamentIssue')} ${tournamentName}`);
    }
  }, [tournamentName]);
  
  // Focus on subject input when modal opens
  useEffect(() => {
    if (isOpen && subjectInputRef.current) {
      setTimeout(() => {
        subjectInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('support.fileTooLarge'));
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    
    try {
      setIsUploading(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `support-${Date.now()}.${fileExt}`;
      const filePath = `support-attachments/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments') // Reusing the existing bucket
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('support.uploadError'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('support.mustBeLoggedIn'));
      return;
    }
    
    if (!subject.trim() || !description.trim()) {
      toast.error(t('support.fillAllFields'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Upload file if selected
      let fileUrl = null;
      if (selectedFile) {
        fileUrl = await uploadFile();
      }
      
      // Add file URL to description if uploaded
      let fullDescription = description.trim();
      if (fileUrl) {
        fullDescription += `\n\n${t('support.attachmentLabel')} ${fileUrl}\n${t('support.fileName')} ${selectedFile.name}`;
      }
      
      const result = await createSupportTicket(
        user.id,
        subject.trim(),
        fullDescription,
        tournamentId
      );
      
      if (result.success) {
        toast.success(t('support.ticketCreatedSuccess'));
        setSubject('');
        setDescription('');
        setSelectedFile(null);
        onClose();
      } else {
        toast.error(result.error || t('support.ticketCreationError'));
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(t('support.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl my-8 flex flex-col h-[calc(100vh-4rem)] border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <LifeBuoy className="text-primary-500 h-5 w-5 mr-2" />
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white">
              {t('support.contactSupport')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label={t('support.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
            {tournamentId && tournamentName && (
              <div className="bg-primary-100 dark:bg-primary-600/10 border border-primary-300 dark:border-primary-600/30 p-4 rounded-lg flex items-center">
                <Trophy className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-primary-700 dark:text-primary-300 font-medium">{t('support.relatedToTournament')}</p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">{tournamentName}</p>
                </div>
              </div>
            )}
            
            {/* File Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('support.attachment')}
              </label>
              <div className="flex items-center">
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-gray-200 dark:bg-dark-300 rounded-lg p-2 w-full">
                    <div className="flex items-center flex-1 min-w-0">
                      <File className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      <span className="text-sm truncate text-gray-900 dark:text-white">{selectedFile.name}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                      aria-label={t('support.removeFile')}
                      type="button"
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    {t('support.addFile')}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('support.acceptedFormats')}
              </p>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('support.ticketSubject')} <span className="text-error-500">*</span>
              </label>
              <input
                ref={subjectInputRef}
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('support.subjectPlaceholder')}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('support.ticketDescription')} <span className="text-error-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px]"
                placeholder={t('support.descriptionPlaceholder')}
                required
              />
            </div>
            
            <div className="bg-info-100 dark:bg-info-500/20 border border-info-300 dark:border-info-600/30 p-4 rounded-lg">
              <p className="text-info-700 dark:text-info-300 text-sm">
                {t('support.supportResponseInfo')}
              </p>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              {t('support.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !subject.trim() || !description.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              {isSubmitting || isUploading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  {isUploading ? t('support.uploading') : t('support.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('support.sendMessage')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;