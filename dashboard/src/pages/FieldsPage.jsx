import { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:5000/api';

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch fields
  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fields/list?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setFields(data.fields || []);
      }
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Field name is required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update field
        const response = await fetch(`${API_BASE_URL}/fields/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldId: editingId,
            name: formData.name,
            location: formData.location,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Field updated successfully');
          setEditingId(null);
          setFormData({ name: '', location: '' });
          setShowForm(false);
          await fetchFields();
        } else {
          setError(data.error || 'Failed to update field');
        }
      } else {
        // Create field
        const response = await fetch(`${API_BASE_URL}/fields/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: formData.name,
            location: formData.location,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Field created successfully');
          setFormData({ name: '', location: '' });
          setShowForm(false);
          await fetchFields();
        } else {
          setError(data.error || 'Failed to create field');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field) => {
    setEditingId(field.id);
    setFormData({
      name: field.name,
      location: field.location || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field? All associated data will be lost.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fields/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Field deleted successfully');
        await fetchFields();
      } else {
        setError(data.error || 'Failed to delete field');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', location: '' });
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Field Management</h1>
          <p className="text-gray-600 mt-2">Manage your agricultural fields and monitoring areas</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            <PlusIcon className="w-5 h-5" />
            Add Field
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <XMarkIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-3">
          <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {editingId ? 'Edit Field' : 'Create New Field'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Field Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Field 1, North Greenhouse"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Farm North, Greenhouse 2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update Field' : 'Create Field'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fields List */}
      {loading && !showForm ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-4">Loading fields...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Fields Yet</h3>
          <p className="text-gray-600 mb-6">Create your first field to start monitoring</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Create Field
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <div key={field.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{field.name}</h3>
                  {field.location && (
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <MapPinIcon className="w-4 h-4" />
                      {field.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Created: {new Date(field.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(field)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all font-semibold text-sm"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(field.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-all font-semibold text-sm"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
