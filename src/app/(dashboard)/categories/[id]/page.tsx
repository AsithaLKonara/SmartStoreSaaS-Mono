'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function CategoryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });

  const fetchCategory = useCallback(async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const cat = data.category || data.data || data;
        setCategory(cat);
        setFormData({ name: cat.name, description: cat.description || '', isActive: cat.isActive });
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update');
      toast.success('Category updated');
      setIsEditing(false);
      await fetchCategory();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this category?')) return;
    try {
      const response = await fetch(`/api/categories/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Category deleted');
      router.push('/dashboard/categories');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!category) return <div className="p-6"><Button onClick={() => router.push('/dashboard/categories')}>Back</Button></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Category' : category.name}</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
              <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="ml-2">Active</Label>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-600">Name</dt>
              <dd className="font-semibold text-lg">{category.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Description</dt>
              <dd>{category.description || 'No description'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Status</dt>
              <dd>
                <span className={`px-3 py-1 rounded-full text-sm ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

