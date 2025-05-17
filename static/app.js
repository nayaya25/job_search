document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const postsContainer = document.getElementById('postsContainer');
    const emptyFeedMessage = document.getElementById('emptyFeedMessage');
    
    // Load posts from localStorage
    let posts = JSON.parse(localStorage.getItem('jobmatchPosts')) || [];
    
    // Check if we're on the create post page
    if (document.getElementById('postButton')) {
        // Create post page functionality
        const postButton = document.getElementById('postButton');
        const insertButton = document.getElementById('insertButton');
        const postTextarea = document.getElementById('postContent');
        const attachmentOptions = document.getElementById('attachmentOptions');
        const attachmentPreview = document.getElementById('attachmentPreview');
        
        // Attachment buttons
        const addLinkBtn = document.getElementById('addLinkBtn');
        const addImageBtn = document.getElementById('addImageBtn');
        const addVideoBtn = document.getElementById('addVideoBtn');
        
        // Attachment inputs
        const linkInput = document.getElementById('linkInput');
        const imageInput = document.getElementById('imageInput');
        const videoInput = document.getElementById('videoInput');
        
        // Add attachment buttons
        const addLink = document.getElementById('addLink');
        const addImage = document.getElementById('addImage');
        const addVideo = document.getElementById('addVideo');
        
        // Current attachment data
        let currentAttachment = null;
        
        // Toggle attachment options
        insertButton.addEventListener('click', function() {
            attachmentOptions.classList.toggle('show');
            // Hide all input fields when toggling
            linkInput.classList.remove('active');
            imageInput.classList.remove('active');
            videoInput.classList.remove('active');
        });
        
        // Show link input
        addLinkBtn.addEventListener('click', function() {
            linkInput.classList.add('active');
            imageInput.classList.remove('active');
            videoInput.classList.remove('active');
        });
        
        // Show image input
        addImageBtn.addEventListener('click', function() {
            imageInput.classList.add('active');
            linkInput.classList.remove('active');
            videoInput.classList.remove('active');
        });
        
        // Show video input
        addVideoBtn.addEventListener('click', function() {
            videoInput.classList.add('active');
            linkInput.classList.remove('active');
            imageInput.classList.remove('active');
        });
        
        // Add link attachment
        addLink.addEventListener('click', function() {
            const url = document.getElementById('linkUrl').value.trim();
            if (url) {
                currentAttachment = {
                    type: 'link',
                    url: url
                };
                showAttachmentPreview();
                clearAttachmentInputs();
                attachmentOptions.classList.remove('show');
            }
        });
        
        // Add image attachment
        addImage.addEventListener('click', function() {
            const url = document.getElementById('imageUrl').value.trim();
            if (url) {
                currentAttachment = {
                    type: 'image',
                    url: url
                };
                showAttachmentPreview();
                clearAttachmentInputs();
                attachmentOptions.classList.remove('show');
            }
        });
        
        // Add video attachment
        addVideo.addEventListener('click', function() {
            const url = document.getElementById('videoUrl').value.trim();
            if (url) {
                currentAttachment = {
                    type: 'video',
                    url: url
                };
                showAttachmentPreview();
                clearAttachmentInputs();
                attachmentOptions.classList.remove('show');
            }
        });
        
        // Remove attachment
        attachmentPreview.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-attachment')) {
                currentAttachment = null;
                attachmentPreview.classList.remove('show');
                attachmentPreview.innerHTML = '';
            }
        });
        
        // Post button click handler
        postButton.addEventListener('click', function() {
            const content = postTextarea.value.trim();
            if (content || currentAttachment) {
                // Create new post
                const newPost = {
                    id: Date.now(),
                    user: 'You',
                    content: content,
                    attachment: currentAttachment,
                    time: 'Just now',
                    likes: 0,
                    isLiked: false,
                    comments: []
                };
                
                // Add to beginning of posts array
                posts.unshift(newPost);
                
                // Save to localStorage
                localStorage.setItem('jobmatchPosts', JSON.stringify(posts));
                
                // Clear form
                postTextarea.value = '';
                currentAttachment = null;
                attachmentPreview.classList.remove('show');
                attachmentPreview.innerHTML = '';
                
                // Redirect to home page
                window.location.href = 'home.html';
            }
        });
        
        // Function to show attachment preview
        function showAttachmentPreview() {
            attachmentPreview.innerHTML = '';
            
            if (currentAttachment) {
                let previewContent = '';
                
                if (currentAttachment.type === 'link') {
                    previewContent = `
                        <div>
                            <a href="${currentAttachment.url}" target="_blank">${currentAttachment.url}</a>
                            <div class="remove-attachment">Remove attachment</div>
                        </div>
                    `;
                } else if (currentAttachment.type === 'image') {
                    previewContent = `
                        <div>
                            <img src="${currentAttachment.url}" alt="Attached image">
                            <div class="remove-attachment">Remove attachment</div>
                        </div>
                    `;
                } else if (currentAttachment.type === 'video') {
                    previewContent = `
                        <div>
                            <video controls>
                                <source src="${currentAttachment.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <div class="remove-attachment">Remove attachment</div>
                        </div>
                    `;
                }
                
                attachmentPreview.innerHTML = previewContent;
                attachmentPreview.classList.add('show');
            }
        }
        
        // Function to clear attachment inputs
        function clearAttachmentInputs() {
            document.getElementById('linkUrl').value = '';
            document.getElementById('imageUrl').value = '';
            document.getElementById('videoUrl').value = '';
            linkInput.classList.remove('active');
            imageInput.classList.remove('active');
            videoInput.classList.remove('active');
        }
    }
    
    // Render posts on home page
    if (postsContainer) {
        renderPosts();
        
        // Function to render all posts
        function renderPosts() {
            if (posts.length > 0) {
                emptyFeedMessage.style.display = 'none';
                postsContainer.style.display = 'block';
                
                // Clear existing posts
                postsContainer.innerHTML = '';
                
                // Add each post to the container
                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    postsContainer.appendChild(postElement);
                });
            } else {
                emptyFeedMessage.style.display = 'block';
                postsContainer.style.display = 'none';
            }
        }
        
        // Function to create a post element
        function createPostElement(post) {
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.dataset.id = post.id;
            
            // Create avatar from initials
            const initials = post.user.split(' ').map(name => name[0]).join('');
            
            // Create attachment HTML if exists
            let attachmentHtml = '';
            if (post.attachment) {
                if (post.attachment.type === 'link') {
                    attachmentHtml = `
                        <div class="post-attachment">
                            <a href="${post.attachment.url}" target="_blank">${post.attachment.url}</a>
                        </div>
                    `;
                } else if (post.attachment.type === 'image') {
                    attachmentHtml = `
                        <div class="post-attachment">
                            <img src="${post.attachment.url}" alt="Attached image">
                        </div>
                    `;
                } else if (post.attachment.type === 'video') {
                    attachmentHtml = `
                        <div class="post-attachment">
                            <video controls>
                                <source src="${post.attachment.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                }
            }
            
            // Create comments HTML
            let commentsHtml = '';
            if (post.comments && post.comments.length > 0) {
                commentsHtml = `
                    <div class="post-comments">
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <div class="comment-user">${comment.user}</div>
                                <div class="comment-content">${comment.content}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            postDiv.innerHTML = `
                <div class="post-header">
                    <div class="post-avatar">${initials}</div>
                    <div>
                        <span class="post-user">${post.user}</span>
                        <span class="post-time">${post.time}</span>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                ${attachmentHtml}
                <div class="post-footer">
                    <div class="post-action ${post.isLiked ? 'liked' : ''}" data-action="like">
                        <i class="fas fa-thumbs-up"></i> <span>${post.likes}</span>
                    </div>
                    <div class="post-action" data-action="comment">
                        <i class="fas fa-comment"></i> <span>${post.comments ? post.comments.length : 0}</span>
                    </div>
                    <div class="post-action" data-action="share">
                        <i class="fas fa-share"></i> <span>Share</span>
                    </div>
                </div>
                ${commentsHtml}
            `;
            
            // Add event listeners for post actions
            const likeButton = postDiv.querySelector('[data-action="like"]');
            likeButton.addEventListener('click', function() {
                toggleLike(post.id);
            });
            
            const commentButton = postDiv.querySelector('[data-action="comment"]');
            commentButton.addEventListener('click', function() {
                addComment(post.id);
            });
            
            const shareButton = postDiv.querySelector('[data-action="share"]');
            shareButton.addEventListener('click', function() {
                sharePost(post.id);
            });
            
            return postDiv;
        }
        
        // Function to toggle like on a post
        function toggleLike(postId) {
            const postIndex = posts.findIndex(post => post.id == postId);
            if (postIndex !== -1) {
                const post = posts[postIndex];
                post.isLiked = !post.isLiked;
                post.likes += post.isLiked ? 1 : -1;
                
                // Save to localStorage
                localStorage.setItem('jobmatchPosts', JSON.stringify(posts));
                
                // Re-render posts
                renderPosts();
            }
        }
        
        // Function to add comment to a post
        function addComment(postId) {
            const comment = prompt('Enter your comment:');
            if (comment) {
                const postIndex = posts.findIndex(post => post.id == postId);
                if (postIndex !== -1) {
                    const post = posts[postIndex];
                    if (!post.comments) {
                        post.comments = [];
                    }
                    post.comments.push({
                        user: 'You',
                        content: comment
                    });
                    
                    // Save to localStorage
                    localStorage.setItem('jobmatchPosts', JSON.stringify(posts));
                    
                    // Re-render posts
                    renderPosts();
                }
            }
        }
        
        // Function to share a post
        function sharePost(postId) {
            const postIndex = posts.findIndex(post => post.id == postId);
            if (postIndex !== -1) {
                const post = posts[postIndex];
                alert(`Sharing post: "${post.content.substring(0, 30)}..."`);
                // In a real app, this would use the Web Share API or social media sharing
            }
        }
    }
    
    // Jobs section functionality
    if (document.getElementById('jobs')) {
        // This would be where you'd load job listings
        // For now, we'll just add a placeholder
        const jobsSection = document.getElementById('jobs');
        jobsSection.innerHTML = `
            <h2><i class="fas fa-briefcase"></i> Job Opportunities</h2>
            <p>Browse the latest job openings in your network.</p>
            <div class="job-listings">
                <div class="job-card">
                    <h3>Frontend Developer</h3>
                    <p>TechCorp - San Francisco, CA</p>
                    <a href="#" class="primary-button">View Job</a>
                </div>
                <div class="job-card">
                    <h3>UX Designer</h3>
                    <p>DesignHub - Remote</p>
                    <a href="#" class="primary-button">View Job</a>
                </div>
            </div>
        `;
    }
});