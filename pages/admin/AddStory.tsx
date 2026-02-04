import React, { useState, useEffect } from "react";
import { getCategories } from "@/services/category.service";
import { createStory } from "@/services/story.service";

interface Category {
  _id: string;
  name: string;
}

const AddStory: React.FC = () => {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    categoryId: "",
    tags: "",
    initialChapters: 1,
    currentCount: 0,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch {
        setError("Không tải được danh mục");
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "initialChapters" || name === "currentCount"
          ? Number(value)
          : value,
    }));

    if (name === "title") {
      const autoSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      setForm((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const total = Number(form.initialChapters) || 0;
      let current = Number(form.currentCount) || 0;
      if (current > total) current = total;

      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        coverImage: form.coverImage,
        categoryId: form.categoryId,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        chaptersCount: total,
        currentCount: current,
      };

      await createStory(payload);

      setSuccess("✅ Thêm truyện thành công!");
      setForm({
        title: "",
        slug: "",
        description: "",
        coverImage: "",
        categoryId: "",
        tags: "",
        initialChapters: 1,
        currentCount: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi thêm truyện");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header giống Player */}
        <div className=" px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black text-center">
            Thêm Truyện Mới
          </h1>
        </div>

        <div className="p-6 sm:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tên truyện *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tên truyện"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Slug *
              </label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="Slug tự động từ tên"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mô tả
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả ngắn gọn về truyện"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Link ảnh bìa
              </label>
              <input
                type="url"
                name="coverImage"
                value={form.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Danh mục *
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tags (cách nhau bằng dấu phẩy)
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="huyền huyễn, hệ thống, xuyên không"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Chapters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tổng số chương
                </label>
                <input
                  type="number"
                  name="initialChapters"
                  min={1}
                  value={form.initialChapters}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Chương đã ra
                </label>
                <input
                  type="number"
                  name="currentCount"
                  min={0}
                  max={form.initialChapters}
                  value={form.currentCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Submit Button - giống nút play trong Player */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-full py-4 px-8 font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">
                    hourglass_empty
                  </span>
                  Đang thêm...
                </>
              ) : (
                "Thêm Truyện"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStory;