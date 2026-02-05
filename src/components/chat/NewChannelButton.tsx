import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare } from 'lucide-react';
import CreateChannelModal from './CreateChannelModal';
import ChannelModal from './ChannelModal';

interface NewChannelButtonProps {
  className?: string;
}

const NewChannelButton: React.FC<NewChannelButtonProps> = ({ className }) => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelId, setNewChannelId] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState<string>('');
  
  const handleChannelCreated = (channelId: string, channelName: string) => {
    setNewChannelId(channelId);
    setNewChannelName(channelName);
    setShowCreateModal(false);
    
    // Open the channel modal after a short delay to ensure the create modal is closed
    setTimeout(() => {
      setShowChannelModal(true);
    }, 100);
  };
  
  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowCreateModal(true);
        }}
        className={`flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors ${className || ''}`}
        aria-label={t('chat.createNewChannel')}
      >
        <Plus className="h-5 w-5" />
        <span>{t('chat.createNewChannel')}</span>
      </button>
      
      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChannelCreated={handleChannelCreated}
      />
      
      {/* Channel Modal - Opens after creation */}
      {newChannelId && (
        <ChannelModal
          isOpen={showChannelModal}
          onClose={() => setShowChannelModal(false)}
          channelId={newChannelId}
          channelName={newChannelName}
        />
      )}
    </>
  );
};

export default NewChannelButton;