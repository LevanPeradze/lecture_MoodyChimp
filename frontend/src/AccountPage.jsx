import { useState, useEffect } from 'react';
import PasswordVerificationModal from './PasswordVerificationModal';

const AccountPage = ({ userEmail, onBack, onLogout, onProfileUpdate }) => {
  const [selectedOption, setSelectedOption] = useState('myacc');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userData, setUserData] = useState({ username: '', avatar_url: '', title: '' });
  const [editForm, setEditForm] = useState({ username: '', title: '', avatarPreview: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [ordersSection, setOrdersSection] = useState(null); // 'learn' or 'create'
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const profileTitles = [
    'Banana Baron',
    'Creative Chimp',
    'Art Ape',
    'Design Dweller',
    'Moody Master',
    'Chimp Champion',
    'Studio Star'
  ];

  useEffect(() => {
    // Fetch user data when component mounts or option changes
    if (userEmail) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, userEmail]);

  useEffect(() => {
    // Fetch orders when orders option is selected
    if (selectedOption === 'myorders' && userEmail) {
      fetchOrders();
    }
  }, [selectedOption, userEmail]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      // Fetch course enrollments
      const enrollmentsResponse = await fetch(`http://localhost:4000/api/course-enrollments/${encodeURIComponent(userEmail)}`);
      const enrollmentsData = await enrollmentsResponse.json();
      if (enrollmentsData.success) {
        setCourseEnrollments(enrollmentsData.enrollments || []);
      }

      // Fetch service orders
      const ordersResponse = await fetch(`http://localhost:4000/api/orders/${encodeURIComponent(userEmail)}`);
      const ordersData = await ordersResponse.json();
      if (ordersData.success) {
        setServiceOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const calculateCompletionDate = (orderDate, deliveryTime) => {
    if (!orderDate || !deliveryTime) return null;
    
    const order = new Date(orderDate);
    let daysToAdd = 7; // Default standard delivery
    
    if (deliveryTime === 'fast') {
      daysToAdd = 5;
    } else if (deliveryTime === 'very-fast') {
      daysToAdd = 3;
    }
    
    const completionDate = new Date(order);
    completionDate.setDate(completionDate.getDate() + daysToAdd);
    
    return completionDate;
  };

  const getDaysRemaining = (completionDate) => {
    if (!completionDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completion = new Date(completionDate);
    completion.setHours(0, 0, 0, 0);
    
    const diffTime = completion - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (response.ok && data.user) {
        setUserPassword(data.user.password);
        setUserData({
          username: data.user.username || '',
          avatar_url: data.user.avatar_url || '',
          title: data.user.title || ''
        });
        // Initialize edit form with current data
        setEditForm({
          username: data.user.username || '',
          title: data.user.title || '',
          avatarPreview: data.user.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleShowPassword = () => {
    if (!showPassword) {
      setShowPasswordModal(true);
    } else {
      setShowPassword(false);
    }
  };

  const handlePasswordVerified = () => {
    setShowPassword(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatarPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      let avatarUrl = editForm.avatarPreview;
      
      // If a new file was selected, convert to base64
      if (avatarFile) {
        // For now, we'll store as base64 data URL
        // In production, you'd upload to a storage service
        avatarUrl = editForm.avatarPreview;
      }

      const updateData = {
        email: userEmail
      };

      if (editForm.username !== userData.username) {
        updateData.username = editForm.username;
      }
      if (editForm.title !== userData.title) {
        updateData.title = editForm.title;
      }
      if (avatarUrl !== userData.avatar_url) {
        updateData.avatar_url = avatarUrl;
      }

      const response = await fetch('http://localhost:4000/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserData({
          username: data.user.username || '',
          avatar_url: data.user.avatar_url || '',
          title: data.user.title || ''
        });
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        // Notify parent component to update header avatar
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        setSaveMessage(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveMessage('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-page">
      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordVerified}
      />

      <div className="account-sidebar">
        <button className="account-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="account-profile">
          <div className="account-avatar">
            {userData.avatar_url ? (
              <img src={userData.avatar_url} alt="Profile" className="account-avatar-img" />
            ) : (
              '🍌'
            )}
          </div>
          <div className="account-profile-info">
            <div className="account-profile-name">
              {userData.username || 'Account'}
              {userData.title && <span className="account-profile-title"> • {userData.title}</span>}
            </div>
            <div className="account-profile-email">{userEmail}</div>
          </div>
        </div>

        <div className="account-options">
          <button
            className={`account-option ${selectedOption === 'myacc' ? 'active' : ''}`}
            onClick={() => setSelectedOption('myacc')}
          >
            My Acc
          </button>
          <button
            className={`account-option ${selectedOption === 'editprofile' ? 'active' : ''}`}
            onClick={() => setSelectedOption('editprofile')}
          >
            Edit Profile
          </button>
          <button
            className={`account-option ${selectedOption === 'myorders' ? 'active' : ''}`}
            onClick={() => setSelectedOption('myorders')}
          >
            My Orders
          </button>
        </div>
      </div>

      <div className="account-content">
        {selectedOption === 'myacc' && (
          <div className="account-details">
            <h2 className="account-section-title">My Account</h2>
            
            <div className="account-field">
              <label className="account-field-label">Email</label>
              <div className="account-field-value">{userEmail}</div>
            </div>

            <div className="account-field">
              <label className="account-field-label">Password</label>
              <div className="account-field-password-container">
                <div className="account-field-value password-value">
                  {showPassword ? userPassword : '••••••••'}
                </div>
                <button
                  className="account-password-eye"
                  onClick={handleShowPassword}
                  type="button"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="account-field">
              <button
                className="account-logout-btn"
                onClick={onLogout}
                type="button"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {selectedOption === 'myorders' && (
          <div className="account-details">
            <h2 className="account-section-title">My Orders</h2>
            
            <div className="orders-sections">
              <button
                className={`orders-section-btn ${ordersSection === 'learn' ? 'active' : ''}`}
                onClick={() => setOrdersSection('learn')}
              >
                Learn
              </button>
              <button
                className={`orders-section-btn ${ordersSection === 'create' ? 'active' : ''}`}
                onClick={() => setOrdersSection('create')}
              >
                Create
              </button>
            </div>

            {loadingOrders ? (
              <div className="orders-loading">Loading orders...</div>
            ) : (
              <>
                {ordersSection === 'learn' && (
                  <div className="orders-list">
                    <h3 className="orders-list-title">Purchased Courses</h3>
                    {courseEnrollments.length === 0 ? (
                      <p className="orders-empty">No courses purchased yet.</p>
                    ) : (
                      <div className="orders-items">
                        {courseEnrollments.map((enrollment) => (
                          <div key={enrollment.id} className="order-item">
                            <div className="order-item-header">
                              <h4 className="order-item-title">{enrollment.course_title}</h4>
                              <span className="order-item-price">${enrollment.total_price}</span>
                            </div>
                            <div className="order-item-details">
                              <div className="order-item-detail">
                                <span className="order-detail-label">Enrolled:</span>
                                <span className="order-detail-value">
                                  {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="order-item-detail">
                                <span className="order-detail-label">Status:</span>
                                <span className="order-detail-value order-status">{enrollment.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {ordersSection === 'create' && (
                  <div className="orders-list">
                    <h3 className="orders-list-title">Service Orders</h3>
                    {serviceOrders.length === 0 ? (
                      <p className="orders-empty">No service orders yet.</p>
                    ) : (
                      <div className="orders-items">
                        {serviceOrders.map((order) => {
                          const completionDate = calculateCompletionDate(order.created_at, order.delivery_time);
                          const daysRemaining = getDaysRemaining(completionDate);
                          const isCompleted = daysRemaining !== null && daysRemaining <= 0;
                          
                          return (
                            <div key={order.id} className="order-item">
                              <div className="order-item-header">
                                <h4 className="order-item-title">{order.service_title}</h4>
                                <span className="order-item-price">${order.total_price}</span>
                              </div>
                              <div className="order-item-details">
                                <div className="order-item-detail">
                                  <span className="order-detail-label">Ordered:</span>
                                  <span className="order-detail-value">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="order-item-detail">
                                  <span className="order-detail-label">Status:</span>
                                  <span className="order-detail-value order-status">{order.status}</span>
                                </div>
                                {completionDate && (
                                  <div className="order-item-detail">
                                    <span className="order-detail-label">
                                      {isCompleted ? 'Completed:' : 'Completion:'}
                                    </span>
                                    <span className={`order-detail-value ${isCompleted ? 'completed' : ''}`}>
                                      {isCompleted 
                                        ? new Date(completionDate).toLocaleDateString()
                                        : daysRemaining > 0 
                                          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                                          : 'Due today'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!ordersSection && (
                  <div className="orders-placeholder">
                    <p>Select a section above to view your orders</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedOption === 'editprofile' && (
          <div className="account-details">
            <h2 className="account-section-title">Edit Profile</h2>
            
            {saveMessage && (
              <div className={`account-save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}

            <div className="account-field">
              <label className="account-field-label">Username</label>
              <input
                type="text"
                className="account-field-input"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div className="account-field">
              <label className="account-field-label">Profile Title</label>
              <select
                className="account-field-select"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              >
                <option value="">Select a title</option>
                {profileTitles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>

            <div className="account-field">
              <label className="account-field-label">Profile Avatar</label>
              <div className="account-avatar-upload">
                <div className="account-avatar-preview">
                  {editForm.avatarPreview ? (
                    <img src={editForm.avatarPreview} alt="Preview" className="account-avatar-preview-img" />
                  ) : (
                    <div className="account-avatar-preview-placeholder">🍌</div>
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="account-avatar-input"
                />
                <label htmlFor="avatar-upload" className="account-avatar-label">
                  Choose Image
                </label>
              </div>
            </div>

            <div className="account-field">
              <button
                className="account-save-btn"
                onClick={handleSaveProfile}
                disabled={isSaving}
                type="button"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;

