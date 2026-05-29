export const CHAT_EVENTS = {
	CONNECTION: 'connection',
	JOIN: 'join',

	SEND_MESSAGE: 'send-message',

	RECEIVE_MESSAGE: 'receive-message',
	
	UPDATE_MESSAGE: 'update-message',
	
	MESSAGE_UPDATED: 'message-updated',
	
	DELETE_MESSAGE: 'delete-message',
	
	MESSAGE_DELETED: 'message-deleted',
	
	MARK_READ: 'mark-read',
	
	MESSAGE_READ: 'message-read',
	
	TYPING: 'typing',
	
	ONLINE_USERS: 'online-users',
};

export const CALL_EVENTS = {
    CALL_USER: 'call-user',

    CALL_MADE: 'call-made',

    ANSWER_CALL: 'answer-call',

    CALL_ANSWERED: 'call-answered',

    ICE_CANDIDATE: 'ice-candidate',

    ICE_CANDIDATE_RECEIVED: 'ice-candidate-received',

    END_CALL: 'end-call',

    CALL_ENDED: 'call-ended',

    REJECT_CALL: 'reject-call',

    CALL_REJECTED: 'call-rejected',

    CANCEL_CALL: 'cancel-call',
    
    CALL_CANCELLED: 'call-cancelled',
};