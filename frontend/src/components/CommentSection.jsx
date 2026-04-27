import { useState, useEffect } from 'react';
import '../styles/CommentSection.css';

const handleCommentLike = () => {
  alert('Tính năng thích bình luận đang được phát triển');
};

const DEFAULT_COMMENTS = [
  {
    id: 'c1',
    userName: 'Mèo Lành Mạnh',
    content: 'Lên kéo đi ăn mừng hơi',
    createdAt: '45 phút trước',
    replies: [
      {
        id: 'c1-1',
        userName: 'Trần Dơ Hầy',
        content: 'Uaaaaa',
        createdAt: '43 phút trước'
      },
      {
        id: 'c1-2',
        userName: 'Thái Anh Gay',
        content: 'Vậy là chưa Tây đâu',
        createdAt: '40 phút trước'
      }
    ]
  },
  {
    id: 'c2',
    userName: 'Sang Khùng Long',
    content: 'Nà ná na na....',
    createdAt: '36 phút trước',
    replies: [
      {
        id: 'c2-1',
        userName: 'Thái Anh Gay',
        content: 'Anh Phùng Thanh Độ. Anh Độ Mixi',
        createdAt: '34 phút trước'
      }
    ]
  }
];

export default function CommentSection({ post, comments, onClose, onAddComment, currentUser }) {
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setNewComment('');
  }, [post?.Id]);

  useEffect(() => {
    // Debug logging
    if (currentUser) {
      console.log('CommentSection - currentUser:', {
        name: currentUser.UserName,
        ProfilePictureUrl: currentUser.ProfilePictureUrl,
        fullName: currentUser.fullName
      });
    }
  }, [currentUser]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(post.Id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <div>
            <h2>Bình luận</h2>
            <p>{comments.length} bình luận</p>
          </div>
          <button className="close-comment-modal" onClick={onClose}>✕</button>
        </div>

        <div className="comment-modal-body">
          {comments.length === 0 ? (
            <div className="empty-comment-state">
              <p>Chưa có bình luận nào. Bạn hãy là người bình luận đầu tiên!</p>
            </div>
          ) : (
            <div className="comment-thread">
              {comments.map((comment) => (
                <div key={comment.Id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.userProfilePictureUrl ? (
                      <img 
                        src={comment.userProfilePictureUrl} 
                        alt={comment.userName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          console.warn('Failed to load comment avatar:', comment.userProfilePictureUrl);
                          e.target.style.display = 'none';
                          const fallbackIcon = e.target.nextElementSibling;
                          if (fallbackIcon) {
                            fallbackIcon.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <i 
                      className="fa-solid fa-user" 
                      style={{ 
                        display: comment.userProfilePictureUrl ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    ></i>
                  </div>
                  <div className="comment-content-wrapper">
                    <div className="comment-top-row">
                      <strong>{comment.userName}</strong>
                      <span>{comment.createdAt}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-meta-row">
                      <button className="comment-action-btn" onClick={handleCommentLike}>Thích</button>
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="comment-reply-item">
                            <div className="comment-avatar">
                              {reply.userProfilePictureUrl ? (
                                <img 
                                  src={reply.userProfilePictureUrl} 
                                  alt={reply.userName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    console.warn('Failed to load reply avatar:', reply.userProfilePictureUrl);
                                    e.target.style.display = 'none';
                                    const fallbackIcon = e.target.nextElementSibling;
                                    if (fallbackIcon) {
                                      fallbackIcon.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <i 
                                className="fa-solid fa-user" 
                                style={{ 
                                  display: reply.userProfilePictureUrl ? 'none' : 'flex',
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              ></i>
                            </div>
                            <div className="comment-content-wrapper">
                              <div className="comment-top-row">
                                <strong>{reply.userName}</strong>
                                <span>{reply.createdAt}</span>
                              </div>
                              <p className="comment-text">{reply.content}</p>
                              <div className="comment-meta-row">
                                <button className="comment-action-btn" onClick={handleCommentLike}>Thích</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="comment-input-wrapper">
          <div className="comment-avatar" id="comment-input-avatar">
            {currentUser?.ProfilePictureUrl ? (
              <img 
                src={currentUser.ProfilePictureUrl} 
                alt="Your avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={(e) => {
                  console.warn('Failed to load comment input avatar:', currentUser.ProfilePictureUrl);
                  e.target.style.display = 'none';
                  const fallbackIcon = e.target.nextElementSibling;
                  if (fallbackIcon) {
                    fallbackIcon.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <i 
              className="fa-solid fa-user" 
              style={{ 
                display: currentUser?.ProfilePictureUrl ? 'none' : 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            ></i>
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="comment-input"
          />
          <button className="btn-submit-comment" onClick={handleSubmit}>
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
