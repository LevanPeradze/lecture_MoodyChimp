import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, Bell, Globe, TrendingUp, Eye, Plus, Search, Edit, Trash2, Mail, X, Upload, ImageIcon, Send } from './AdminIcons';
import './AdminPanel.css';

const AdminPanel = ({ userEmail, onBack }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/admin/check/${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        
        if (data.success && data.isAdmin) {
          setIsAdmin(true);
          setAdminData(data.admin);
        } else {
          // Not an admin, redirect back
          if (onBack) onBack();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (onBack) onBack();
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [userEmail, onBack]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'content':
        return <ContentManagerSection />;
      case 'users':
        return <UserManagerSection userEmail={userEmail} />;
      case 'settings':
        return <SettingsSection userEmail={userEmail} />;
      default:
        return <DashboardSection />;
    }
  };

  if (loading) {
    return (
      <div className="admin-panel-loading">
        <div className="admin-panel-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-panel-error">
        <h2>Access Denied</h2>
        <p>You do not have admin privileges.</p>
        <button onClick={onBack} className="admin-panel-back-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-header">
          <h1 className="admin-logo">MOODYCHIMP</h1>
          <p className="admin-subtitle">ADMIN PANEL</p>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <Icon className="admin-nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User Info */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <span>{userEmail?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
            <div className="admin-user-details">
              <p className="admin-user-name">Admin User</p>
              <p className="admin-user-email">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        {renderSection()}
      </main>
    </div>
  );
};

// Dashboard Section
const DashboardSection = () => {
  const stats = [
    { title: 'Total Views', value: '124,563', change: '+12.5%', icon: Eye, trend: 'up' },
    { title: 'Active Users', value: '8,492', change: '+8.2%', icon: Users, trend: 'up' },
    { title: 'Content Items', value: '1,247', change: '+23', icon: FileText, trend: 'up' },
    { title: 'Global Reach', value: '45', change: '+3', icon: Globe, trend: 'up' },
  ];

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Dashboard</h1>
          <p className="admin-section-subtitle">Welcome back, here's what's happening</p>
        </div>
        <button className="admin-btn-primary">
          <Bell className="admin-btn-icon" />
          <span>Notifications</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Placeholder for Analytics and Activity */}
      <div className="admin-dashboard-content">
        <div className="admin-content-card">
          <h2 className="admin-card-title">Analytics Overview</h2>
          <p className="admin-card-subtitle">Traffic and user engagement trends</p>
          <div className="admin-chart-placeholder">
            <p>Chart visualization coming soon</p>
          </div>
        </div>
        <div className="admin-content-card">
          <h2 className="admin-card-title">Recent Activity</h2>
          <p className="admin-card-subtitle">Latest updates and changes</p>
          <div className="admin-activity-list">
            <div className="admin-activity-item">
              <FileText className="admin-activity-icon" />
              <div>
                <p>New project added</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="admin-activity-item">
              <Users className="admin-activity-icon" />
              <div>
                <p>New user registered</p>
                <span>4 hours ago</span>
              </div>
            </div>
            <div className="admin-activity-item">
              <Settings className="admin-activity-icon" />
              <div>
                <p>Settings updated</p>
                <span>6 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, change, icon: Icon, trend }) => {
  return (
    <div className="admin-stats-card">
      <div className="admin-stats-header">
        <div className="admin-stats-icon-wrapper">
          <Icon className="admin-stats-icon" />
        </div>
        <div className={`admin-stats-trend ${trend === 'up' ? 'up' : 'down'}`}>
          <TrendingUp className="admin-trend-icon" />
          <span>{change}</span>
        </div>
      </div>
      <h3 className="admin-stats-label">{title}</h3>
      <p className="admin-stats-value">{value}</p>
    </div>
  );
};

// Content Manager Section
const ContentManagerSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ category: '', title: '', description: '', price: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.services || []);
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setImagePreview(item.banner_image_url || null);
    setSelectedImageFile(null);
    setThumbnailPreview(item.thumbnail_image_url || null);
    setSelectedThumbnailFile(null);
    if (item.type === 'service') {
      setEditForm({
        category: item.category || '',
        title: item.title || '',
        description: item.description || '',
        price: item.price || ''
      });
    } else {
      setEditForm({
        title: item.title || '',
        level: item.level || '',
        icon: item.icon || '',
        illustration: item.illustration || '',
        banner_image_url: item.banner_image_url || '',
        thumbnail_image_url: item.thumbnail_image_url || ''
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (editingItem.type === 'service') {
        const response = await fetch(`http://localhost:4000/api/admin/services/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
        const data = await response.json();
        if (data.success) {
          setEditingItem(null);
          setImagePreview(null);
          setSelectedImageFile(null);
          fetchContent();
        }
      } else if (editingItem.type === 'course') {
        let bannerImageUrl = editForm.banner_image_url || null;
        let thumbnailImageUrl = editForm.thumbnail_image_url || null;

        // Upload banner image to Cloudinary if a new image was selected
        if (selectedImageFile) {
          const formData = new FormData();
          formData.append('image', selectedImageFile);

          try {
            const uploadResponse = await fetch('http://localhost:4000/api/admin/upload-image', {
              method: 'POST',
              body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
              bannerImageUrl = uploadData.imageUrl;
            } else {
              alert('Failed to upload banner image: ' + (uploadData.error || 'Unknown error'));
              return;
            }
          } catch (uploadError) {
            console.error('Error uploading banner image:', uploadError);
            alert('Failed to upload banner image: ' + uploadError.message);
            return;
          }
        }

        // Upload thumbnail image to Cloudinary if a new image was selected
        if (selectedThumbnailFile) {
          const formData = new FormData();
          formData.append('image', selectedThumbnailFile);

          try {
            const uploadResponse = await fetch('http://localhost:4000/api/admin/upload-image', {
              method: 'POST',
              body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
              thumbnailImageUrl = uploadData.imageUrl;
            } else {
              alert('Failed to upload thumbnail image: ' + (uploadData.error || 'Unknown error'));
              return;
            }
          } catch (uploadError) {
            console.error('Error uploading thumbnail image:', uploadError);
            alert('Failed to upload thumbnail image: ' + uploadError.message);
            return;
          }
        }

        // Update course with new data
        const response = await fetch(`http://localhost:4000/api/admin/courses/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editForm.title,
            level: editForm.level,
            icon: editForm.icon,
            illustration: editForm.illustration,
            banner_image_url: bannerImageUrl,
            thumbnail_image_url: thumbnailImageUrl
          })
        });
        const data = await response.json();
        if (data.success) {
          setEditingItem(null);
          setImagePreview(null);
          setSelectedImageFile(null);
          setThumbnailPreview(null);
          setSelectedThumbnailFile(null);
          fetchContent();
          alert('Course updated successfully!');
        } else {
          alert('Failed to update course: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      if (item.type === 'service') {
        const response = await fetch(`http://localhost:4000/api/admin/services/${item.id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          fetchContent();
        }
      }
      // TODO: Add course delete endpoint if needed
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setEditForm({ category: '', title: '', description: '', price: '' });
        fetchContent();
      }
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Failed to add content');
    }
  };

  const allContent = [...services, ...courses];
  const filteredContent = allContent.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type === 'service' && item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Content Manager</h1>
          <p className="admin-section-subtitle">Manage your site content and projects</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="admin-btn-icon" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-wrapper">
        <div className="admin-search">
          <Search className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Category/Level</th>
              <th>Price</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContent.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-quaternary)' }}>
                  No content found
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td>{item.title}</td>
                  <td>{item.type === 'service' ? 'Service' : 'Course'}</td>
                  <td>{item.type === 'service' ? item.category : item.level}</td>
                  <td>{item.price || item.type === 'course' ? 'N/A' : 'N/A'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="admin-action-btn" onClick={() => handleEdit(item)}>
                        <Edit className="admin-action-icon" />
                      </button>
                      <button className="admin-action-btn" onClick={() => handleDelete(item)}>
                        <Trash2 className="admin-action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <>
          {/* Backdrop */}
            <div className="admin-modal-backdrop" onClick={() => { setEditingItem(null); setImagePreview(null); setSelectedImageFile(null); setThumbnailPreview(null); setSelectedThumbnailFile(null); }} />
          
          {/* Popup */}
          <div className="admin-modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit Content</h2>
              <button
                onClick={() => { setEditingItem(null); setImagePreview(null); setSelectedImageFile(null); setThumbnailPreview(null); setSelectedThumbnailFile(null); }}
                className="admin-modal-close"
              >
                <X className="admin-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="admin-modal-content">
              {editingItem.type === 'service' ? (
                <>
                  {/* Change Title */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="admin-input"
                      placeholder="Enter title..."
                    />
                  </div>

                  {/* Change Category */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="admin-input"
                    >
                      <option value="">Select category...</option>
                      <option value="Storyboards">Storyboards</option>
                      <option value="Book design">Book design</option>
                      <option value="Character design">Character design</option>
                      <option value="Game Design">Game Design</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="admin-input"
                      rows="4"
                      placeholder="Enter description..."
                    />
                  </div>

                  {/* Price */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price</label>
                    <input
                      type="text"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="admin-input"
                      placeholder="e.g., Starting at $150"
                    />
                  </div>

                  {/* Change Image */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Image</label>
                    <div className="admin-image-upload-wrapper">
                      <input
                        type="file"
                        id="image-upload-edit"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="admin-image-upload-input"
                      />
                      <label
                        htmlFor="image-upload-edit"
                        className="admin-image-upload-label"
                      >
                        {imagePreview ? (
                          <div className="admin-image-preview-wrapper">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="admin-image-preview"
                            />
                            <div className="admin-image-preview-overlay">
                              <Upload className="admin-image-upload-icon" />
                            </div>
                          </div>
                        ) : (
                          <div className="admin-image-upload-placeholder">
                            <ImageIcon className="admin-image-placeholder-icon" />
                            <p className="admin-image-placeholder-text">Click to upload image</p>
                            <p className="admin-image-placeholder-subtext">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="admin-input"
                      placeholder="Enter title..."
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Level</label>
                    <input
                      type="text"
                      value={editForm.level}
                      onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                      className="admin-input"
                      placeholder="Enter level..."
                    />
                  </div>
                  
                  {/* Course Banner Image Upload (for details page) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Course Banner Image (Details Page)</label>
                    <div className="admin-image-upload-wrapper">
                      <input
                        type="file"
                        id="course-banner-upload-edit"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="admin-image-upload-input"
                      />
                      <label
                        htmlFor="course-banner-upload-edit"
                        className="admin-image-upload-label"
                      >
                        {imagePreview ? (
                          <div className="admin-image-preview-wrapper">
                            <img
                              src={imagePreview}
                              alt="Banner Preview"
                              className="admin-image-preview"
                            />
                            <div className="admin-image-preview-overlay">
                              <Upload className="admin-image-upload-icon" />
                            </div>
                          </div>
                        ) : (
                          <div className="admin-image-upload-placeholder">
                            <ImageIcon className="admin-image-placeholder-icon" />
                            <p className="admin-image-placeholder-text">Click to upload banner image</p>
                            <p className="admin-image-placeholder-subtext">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Course Thumbnail Image Upload (for course cards) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Course Thumbnail Image (Course Cards)</label>
                    <div className="admin-image-upload-wrapper">
                      <input
                        type="file"
                        id="course-thumbnail-upload-edit"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="admin-image-upload-input"
                      />
                      <label
                        htmlFor="course-thumbnail-upload-edit"
                        className="admin-image-upload-label"
                      >
                        {thumbnailPreview ? (
                          <div className="admin-image-preview-wrapper">
                            <img
                              src={thumbnailPreview}
                              alt="Thumbnail Preview"
                              className="admin-image-preview"
                            />
                            <div className="admin-image-preview-overlay">
                              <Upload className="admin-image-upload-icon" />
                            </div>
                          </div>
                        ) : (
                          <div className="admin-image-upload-placeholder">
                            <ImageIcon className="admin-image-placeholder-icon" />
                            <p className="admin-image-placeholder-text">Click to upload thumbnail</p>
                            <p className="admin-image-placeholder-subtext">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                onClick={() => { setEditingItem(null); setImagePreview(null); setSelectedImageFile(null); setThumbnailPreview(null); setSelectedThumbnailFile(null); }}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <>
          {/* Backdrop */}
          <div className="admin-modal-backdrop" onClick={() => { setShowAddModal(false); setImagePreview(null); }} />
          
          {/* Popup */}
          <div className="admin-modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Add New Service</h2>
              <button
                onClick={() => { setShowAddModal(false); setImagePreview(null); }}
                className="admin-modal-close"
              >
                <X className="admin-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="admin-modal-content">
              {/* Title */}
              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="admin-input"
                  placeholder="Enter title..."
                />
              </div>

              {/* Category */}
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="admin-input"
                >
                  <option value="">Select category...</option>
                  <option value="Storyboards">Storyboards</option>
                  <option value="Book design">Book design</option>
                  <option value="Character design">Character design</option>
                  <option value="Game Design">Game Design</option>
                </select>
              </div>

              {/* Description */}
              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="admin-input"
                  rows="4"
                  placeholder="Enter description..."
                />
              </div>

              {/* Price */}
              <div className="admin-form-group">
                <label className="admin-form-label">Price</label>
                <input
                  type="text"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="admin-input"
                  placeholder="e.g., Starting at $150"
                />
              </div>

              {/* Image Upload */}
              <div className="admin-form-group">
                <label className="admin-form-label">Image</label>
                <div className="admin-image-upload-wrapper">
                  <input
                    type="file"
                    id="image-upload-add"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="admin-image-upload-input"
                  />
                  <label
                    htmlFor="image-upload-add"
                    className="admin-image-upload-label"
                  >
                    {imagePreview ? (
                      <div className="admin-image-preview-wrapper">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="admin-image-preview"
                        />
                        <div className="admin-image-preview-overlay">
                          <Upload className="admin-image-upload-icon" />
                        </div>
                      </div>
                    ) : (
                      <div className="admin-image-upload-placeholder">
                        <ImageIcon className="admin-image-placeholder-icon" />
                        <p className="admin-image-placeholder-text">Click to upload image</p>
                        <p className="admin-image-placeholder-subtext">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                onClick={() => { setShowAddModal(false); setImagePreview(null); }}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleAdd}
              >
                Add Service
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// User Manager Section
const UserManagerSection = ({ userEmail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', title: '', avatar_url: '', color_theme: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [messagingUser, setMessagingUser] = useState(null);
    const [messageForm, setMessageForm] = useState({ title: '', message: '' });
    const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setImagePreview(null);
    setEditForm({
      username: user.username || '',
      title: user.title || '',
      avatar_url: user.avatar_url || '',
      color_theme: user.color_theme || 'default'
    });
  };

  const handleSave = async () => {
    try {
      // Ensure color_theme is always included, even if it's the same
      const updateData = {
        ...editForm,
        color_theme: editForm.color_theme || 'default'
      };
      
      console.log('Saving user update:', { userId: editingUser.id, updateData });
      
      const response = await fetch(`http://localhost:4000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        // Verify the theme was saved
        if (data.user && data.user.color_theme) {
          console.log('Theme saved successfully:', data.user.color_theme);
        }
        setEditingUser(null);
        setImagePreview(null);
        fetchUsers();
        alert(`User updated successfully! Theme changed to: ${data.user?.color_theme || editForm.color_theme}. The change will take effect when the user refreshes their page or logs in again.`);
      } else {
        alert('Failed to update user: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${user.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      alert('Message body is required');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: messagingUser.email,
          title: messageForm.title || null,
          message: messageForm.message,
          senderEmail: userEmail // Admin's email
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Message sent successfully!');
        setMessagingUser(null);
        setMessageForm({ title: '', message: '' });
        
        // Trigger event to refresh notifications for the recipient
        window.dispatchEvent(new CustomEvent('newMessage', { 
          detail: { userEmail: messagingUser.email } 
        }));
      } else {
        alert('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">User Management</h1>
          <p className="admin-section-subtitle">Manage team members and permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search-wrapper">
        <div className="admin-search">
          <Search className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="admin-users-grid">
        {filteredUsers.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-quaternary)' }}>
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="admin-user-card">
              <div className="admin-user-card-header">
                <div className="admin-user-card-avatar">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username || user.email} />
                  ) : (
                    <span>{(user.username || user.email || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="admin-badge active">active</span>
              </div>
              <h3>{user.username || 'No username'}</h3>
              <p className="admin-user-card-email">{user.email}</p>
              {user.title && <p className="admin-user-card-role">{user.title}</p>}
              <div className="admin-user-card-footer">
                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                <div className="admin-user-card-actions">
                  <button className="admin-action-btn" onClick={() => setMessagingUser(user)}>
                    <Send className="admin-action-icon" />
                  </button>
                  <button className="admin-action-btn" onClick={() => handleEdit(user)}>
                    <Edit className="admin-action-icon" />
                  </button>
                  <button className="admin-action-btn" onClick={() => handleDelete(user)}>
                    <Trash2 className="admin-action-icon" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <>
          {/* Backdrop */}
          <div className="admin-modal-backdrop" onClick={() => { setEditingUser(null); setImagePreview(null); }} />
          
          {/* Popup */}
          <div className="admin-modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit User</h2>
              <button
                onClick={() => { setEditingUser(null); setImagePreview(null); }}
                className="admin-modal-close"
              >
                <X className="admin-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="admin-modal-content">
              {/* Username */}
              <div className="admin-form-group">
                <label className="admin-form-label">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="admin-input"
                  placeholder="Enter username..."
                />
              </div>

              {/* Email (read-only) */}
              <div className="admin-form-group">
                <label className="admin-form-label">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  className="admin-input"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-quinary)', margin: '0.25rem 0 0 0' }}>
                  Email cannot be changed
                </p>
              </div>

              {/* Title */}
              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="admin-input"
                  placeholder="e.g., Creative Chimp, Banana Baron..."
                />
              </div>

              {/* Avatar URL */}
              <div className="admin-form-group">
                <label className="admin-form-label">Avatar URL</label>
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setEditForm({ ...editForm, avatar_url: url });
                    // Clear image preview when URL is manually entered
                    if (url && !url.startsWith('data:')) {
                      setImagePreview(null);
                    }
                  }}
                  onPaste={(e) => {
                    // Allow paste to work normally
                    setTimeout(() => {
                      const url = e.target.value;
                      setEditForm({ ...editForm, avatar_url: url });
                      if (url && !url.startsWith('data:')) {
                        setImagePreview(null);
                      }
                    }, 0);
                  }}
                  className="admin-input"
                  placeholder="Paste or enter avatar image URL..."
                />
              </div>

              {/* Avatar Image Preview */}
              {(editForm.avatar_url || imagePreview) && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Avatar Preview</label>
                  <div className="admin-avatar-preview-wrapper">
                    <img
                      src={imagePreview || editForm.avatar_url}
                      alt="Avatar preview"
                      className="admin-avatar-preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Avatar Image */}
              <div className="admin-form-group">
                <label className="admin-form-label">Upload Avatar Image (Alternative)</label>
                <div className="admin-image-upload-wrapper">
                  <input
                    type="file"
                    id="avatar-upload-edit"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const dataUrl = reader.result;
                          setImagePreview(dataUrl);
                          setEditForm({ ...editForm, avatar_url: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="admin-image-upload-input"
                  />
                  <label
                    htmlFor="avatar-upload-edit"
                    className="admin-image-upload-label"
                  >
                    {imagePreview ? (
                      <div className="admin-image-preview-wrapper">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="admin-image-preview"
                        />
                        <div className="admin-image-preview-overlay">
                          <Upload className="admin-image-upload-icon" />
                        </div>
                      </div>
                    ) : (
                      <div className="admin-image-upload-placeholder">
                        <ImageIcon className="admin-image-placeholder-icon" />
                        <p className="admin-image-placeholder-text">Click to upload avatar image</p>
                        <p className="admin-image-placeholder-subtext">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-quinary)', margin: '0.5rem 0 0 0' }}>
                  Or paste an image URL in the field above
                </p>
              </div>

              {/* Color Theme */}
              <div className="admin-form-group">
                <label className="admin-form-label">Color Theme</label>
                <select
                  value={editForm.color_theme}
                  onChange={(e) => setEditForm({ ...editForm, color_theme: e.target.value })}
                  className="admin-input"
                >
                  <option value="default">Default</option>
                  <option value="neon">Neon</option>
                  <option value="vintage">Vintage</option>
                </select>
              </div>

              {/* User Stats (read-only info) */}
              <div className="admin-form-group">
                <label className="admin-form-label">User Statistics</label>
                <div className="admin-user-stats">
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Orders:</span>
                    <span className="admin-stat-value">{editingUser.order_count || 0}</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Enrollments:</span>
                    <span className="admin-stat-value">{editingUser.enrollment_count || 0}</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Joined:</span>
                    <span className="admin-stat-value">{new Date(editingUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                onClick={() => { setEditingUser(null); setImagePreview(null); }}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Send Message Modal */}
      {messagingUser && (
        <>
          {/* Backdrop */}
          <div className="admin-modal-backdrop" onClick={() => {
            setMessagingUser(null);
            setMessageForm({ title: '', message: '' });
          }} />

          {/* Popup */}
          <div className="admin-modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Send Message to {messagingUser.username || messagingUser.email}</h2>
              <button
                onClick={() => {
                  setMessagingUser(null);
                  setMessageForm({ title: '', message: '' });
                }}
                className="admin-modal-close"
              >
                <X className="admin-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="admin-modal-content">
              {/* Title */}
              <div className="admin-form-group">
                <label className="admin-form-label">Title (Optional)</label>
                <input
                  type="text"
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                  className="admin-input"
                  placeholder="Enter message title..."
                />
              </div>

              {/* Message Body */}
              <div className="admin-form-group">
                <label className="admin-form-label">Message Body <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  className="admin-input"
                  placeholder="Enter your message..."
                  rows={8}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                onClick={() => {
                  setMessagingUser(null);
                  setMessageForm({ title: '', message: '' });
                }}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageForm.message.trim()}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Settings Section
const SettingsSection = ({ userEmail }) => {
  const [siteName, setSiteName] = useState('MOODYCHIMP');
  const [tagline, setTagline] = useState('CREATIVE STUDIO / GLOBAL');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/settings');
      const data = await response.json();
      if (data.success && data.settings) {
        setSiteName(data.settings.site_name || 'MOODYCHIMP');
        setTagline(data.settings.tagline || 'CREATIVE STUDIO / GLOBAL');
        setEmailNotifications(data.settings.email_notifications === 'true');
        setPushNotifications(data.settings.push_notifications === 'true');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            site_name: siteName,
            tagline: tagline,
            email_notifications: String(emailNotifications),
            push_notifications: String(pushNotifications)
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    setChangingPassword(true);

    try {
      // Get user ID from email
      const userResponse = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
      const userData = await userResponse.json();
      
      if (!userData.success || !userData.user) {
        throw new Error('Failed to fetch user information');
      }

      // Update password
      const response = await fetch(`http://localhost:4000/api/admin/users/${userData.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Settings</h1>
          <p className="admin-section-subtitle">Manage your site configuration</p>
        </div>
      </div>

      <div className="admin-settings-grid">
        {/* General Settings */}
        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon-wrapper">
              <Globe className="admin-settings-icon" />
            </div>
            <div>
              <h2 className="admin-settings-card-title">General</h2>
              <p className="admin-settings-card-subtitle">Basic site information</p>
            </div>
          </div>
          <div className="admin-settings-form">
            <div className="admin-form-group">
              <label>Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="admin-form-group">
              <label>Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon-wrapper">
              <Bell className="admin-settings-icon" />
            </div>
            <div>
              <h2 className="admin-settings-card-title">Notifications</h2>
              <p className="admin-settings-card-subtitle">Configure notification preferences</p>
            </div>
          </div>
          <div className="admin-settings-form">
            <div className="admin-toggle-group">
              <div>
                <p className="admin-toggle-label">Email Notifications</p>
                <p className="admin-toggle-description">Receive updates via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`admin-toggle ${emailNotifications ? 'active' : ''}`}
              >
                <div className="admin-toggle-slider"></div>
              </button>
            </div>
            <div className="admin-toggle-group">
              <div>
                <p className="admin-toggle-label">Push Notifications</p>
                <p className="admin-toggle-description">Receive browser notifications</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`admin-toggle ${pushNotifications ? 'active' : ''}`}
              >
                <div className="admin-toggle-slider"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-icon-wrapper">
              <Settings className="admin-settings-icon" />
            </div>
            <div>
              <h2 className="admin-settings-card-title">Security</h2>
              <p className="admin-settings-card-subtitle">Manage security settings</p>
            </div>
          </div>
          <button 
            className="admin-btn-secondary" 
            onClick={() => {
              setShowPasswordModal(true);
              setNewPassword('');
              setConfirmPassword('');
              setPasswordError('');
            }}
          >
            Change Password
          </button>
        </div>
      </div>

      <button 
        className="admin-btn-primary admin-save-btn" 
        onClick={handleSave}
        disabled={saving}
      >
        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
      </button>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <>
          {/* Backdrop */}
          <div className="admin-modal-backdrop" onClick={() => {
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
          }} />
          
          {/* Popup */}
          <div className="admin-modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="admin-modal-close"
              >
                <X className="admin-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="admin-modal-content">
              {/* New Password */}
              <div className="admin-form-group">
                <label className="admin-form-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="admin-input"
                  placeholder="Enter new password..."
                />
              </div>

              {/* Re-enter New Password */}
              <div className="admin-form-group">
                <label className="admin-form-label">Re-enter New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="admin-input"
                  placeholder="Re-enter new password..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordChange();
                    }
                  }}
                />
                {passwordError && (
                  <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '0.5rem 0 0 0' }}>
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button
                className="admin-btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handlePasswordChange}
                disabled={changingPassword || !newPassword || !confirmPassword}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;

