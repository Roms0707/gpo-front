import { supabase } from '../lib/supabase';

// Get all channel invitations for the current user
export const getChannelInvitations = async () => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to view channel invitations');
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        id,
        channel_id,
        role,
        joined_at,
        channels:channel_id (
          id,
          name,
          description,
          created_at,
          is_private,
          created_by,
          users:created_by (
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching channel invitations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChannelInvitations:', error);
    return [];
  }
};

// Accept a channel invitation
export const acceptChannelInvitation = async (membershipId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to accept invitations');
    }

    const userId = userData.user.id;

    // Verify this invitation belongs to the current user
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('id, user_id')
      .eq('id', membershipId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (membershipError || !membership) {
      console.error('Error verifying invitation:', membershipError);
      throw new Error('Invalid invitation');
    }

    // Update the status to accepted
    const { error: updateError } = await supabase
      .from('channel_members')
      .update({ status: 'accepted' })
      .eq('id', membershipId);

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      throw updateError;
    }

    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error) {
    console.error('Error in acceptChannelInvitation:', error);
    return { success: false, message: error.message || 'Failed to accept invitation' };
  }
};

// Reject a channel invitation
export const rejectChannelInvitation = async (membershipId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to reject invitations');
    }

    const userId = userData.user.id;

    // Verify this invitation belongs to the current user
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('id, user_id')
      .eq('id', membershipId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (membershipError || !membership) {
      console.error('Error verifying invitation:', membershipError);
      throw new Error('Invalid invitation');
    }

    // Delete the membership record
    const { error: deleteError } = await supabase
      .from('channel_members')
      .delete()
      .eq('id', membershipId);

    if (deleteError) {
      console.error('Error rejecting invitation:', deleteError);
      throw deleteError;
    }

    return { success: true, message: 'Invitation rejected successfully' };
  } catch (error) {
    console.error('Error in rejectChannelInvitation:', error);
    return { success: false, message: error.message || 'Failed to reject invitation' };
  }
};

// Create a new channel
export const createChannel = async (
  name: string,
  description: string = '',
  isPrivate: boolean = false,
  isCommunity: boolean = false,
  imageUrl: string | null = null
): Promise<{ id: string } | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to create a channel');
    }

    const userId = userData.user.id;

    // Create the channel
    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .insert([
        {
          name,
          description,
          image_url: imageUrl,
          created_by: userId,
          is_private: isPrivate,
          is_community: isCommunity
        }
      ])
      .select('id')
      .single();

    if (channelError) {
      console.error('Error creating channel:', channelError);
      throw channelError;
    }

    if (!channelData) {
      throw new Error('Failed to create channel');
    }

    // Add the creator as an admin member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: channelData.id,
          user_id: userId,
          role: 'admin',
          status: 'accepted'
        }
      ]);

    if (memberError) {
      console.error('Error adding creator as channel member:', memberError);
      // Try to delete the channel since we couldn't add the creator
      await supabase.from('channels').delete().eq('id', channelData.id);
      throw memberError;
    }

    return { id: channelData.id };
  } catch (error) {
    console.error('Error in createChannel:', error);
    return null;
  }
};

// Get all channels the current user is a member of
export const getUserChannels = async () => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to view channels');
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        role,
        channels:channel_id (
          id,
          name,
          description,
          created_at,
          is_private,
          created_by
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user channels:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserChannels:', error);
    return [];
  }
};

// Get all public channels
export const getPublicChannels = async () => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('id, name, description, created_at, created_by, is_private, is_community, image_url')
      .eq('is_private', false);

    if (error) {
      console.error('Error fetching public channels:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPublicChannels:', error);
    return [];
  }
};

// Join a channel
export const joinChannel = async (channelId: string, specificUserId?: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to join a channel');
    }

    // Use the provided user ID or fall back to the current user's ID
    const userId = specificUserId || userData.user.id;

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('channel_members')
      .select('id, status')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking channel membership:', checkError);
      throw checkError;
    }

    // If already a member with accepted status, return success
    if (existingMember && existingMember.status === 'accepted') {
      return { success: true, message: 'Already a member of this channel' };
    }

    // If there's a pending invitation, update it to accepted
    if (existingMember && existingMember.status === 'pending') {
      const { error: updateError } = await supabase
        .from('channel_members')
        .update({ status: 'accepted' })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('Error accepting invitation:', updateError);
        throw updateError;
      }

      return { success: true, message: 'Invitation accepted' };
    }

    // For community channels or when a specific user is being added by an admin,
    // create a new membership with accepted status
    let status = 'accepted';

    // If it's not a specific user being added (i.e., self-join) and not a community channel,
    // check if we need to set status to pending
    if (!specificUserId) {
      // Get channel info to check if it's a community channel
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('is_community')
        .eq('id', channelId)
        .single();

      if (channelError) {
        console.error('Error checking channel type:', channelError);
        throw channelError;
      }

      // If it's not a community channel, set status to pending
      if (!channelData.is_community) {
        status = 'pending';
      }
    }

    // Create the membership
    try {
      const { error: insertError } = await supabase
        .from('channel_members')
        .insert([
          {
            channel_id: channelId,
            user_id: userId,
            role: 'member',
            status: status
          }
        ]);

      if (insertError) {
        console.error('Error joining channel:', insertError);
        throw insertError;
      }

      return {
        success: true,
        message: status === 'pending'
          ? 'Invitation sent successfully'
          : 'Successfully joined channel'
      };
    } catch (error) {
      console.error('Error in joinChannel:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in joinChannel:', error);
    return { success: false, message: error.message || 'Failed to join channel' };
  }
};

// Leave a channel
export const leaveChannel = async (channelId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to leave a channel');
    }

    const userId = userData.user.id;

    // Check if user is an admin and the only member
    const { data: members, error: membersError } = await supabase
      .from('channel_members')
      .select('id, role')
      .eq('channel_id', channelId);

    if (membersError) {
      console.error('Error checking channel members:', membersError);
      throw membersError;
    }

    const userMember = members?.find(m => m.id === userId);

    if (userMember?.role === 'admin' && members?.length === 1) {
      // User is the only admin, delete the channel
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (deleteError) {
        console.error('Error deleting channel:', deleteError);
        throw deleteError;
      }

      return { success: true, message: 'Channel deleted successfully' };
    }

    // Leave the channel
    const { error: leaveError } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (leaveError) {
      console.error('Error leaving channel:', leaveError);
      throw leaveError;
    }

    return { success: true, message: 'Successfully left channel' };
  } catch (error) {
    console.error('Error in leaveChannel:', error);
    return { success: false, message: error.message || 'Failed to leave channel' };
  }
};

// Get channel members
export const getChannelMembers = async (channelId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        id,
        user_id,
        role,
       status,
        joined_at,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
     .eq('channel_id', channelId)
     .order('role', { ascending: false }); // Admins first

    if (error) {
      console.error('Error fetching channel members:', error);
      throw error;
    }

   console.log("Channel members data:", data);
    return data || [];
  } catch (error) {
    console.error('Error in getChannelMembers:', error);
    return [];
  }
};

// Send a message to a channel
export const sendChannelMessage = async (
  channelId: string,
  content: string,
  fileUrl?: string,
  fileName?: string,
  fileType?: string
) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to send a message');
    }

    const userId = userData.user.id;

    // Check if user is a member of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking channel membership:', membershipError);
      throw membershipError;
    }

    if (!membership) {
      throw new Error('You must be a member of this channel to send messages');
    }

    // Send the message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: userId,
          receiver_id: null, // No direct receiver for channel messages
          channel_id: channelId,
          content,
          type: 'channel',
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error sending channel message:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendChannelMessage:', error);
    throw error;
  }
};

// Get messages for a channel
export const getChannelMessages = async (channelId: string, page: number = 1, limit: number = 20) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('Error getting current user:', userError);
      throw new Error('You must be logged in to view channel messages');
    }

    const userId = userData.user.id;

    // Check if user is a member of the channel
    const { data: membership, error: membershipError } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking channel membership:', membershipError);
      throw membershipError;
    }

    if (!membership) {
      throw new Error('You must be a member of this channel to view messages');
    }

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get messages
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        read,
        file_url,
        file_name,
        file_type,
        sender:sender_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)
      .eq('type', 'channel')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching channel messages:', error);
      throw error;
    }

    // Reverse to show oldest first
    return (data || []).reverse();
  } catch (error) {
    console.error('Error in getChannelMessages:', error);
    return [];
  }
};
