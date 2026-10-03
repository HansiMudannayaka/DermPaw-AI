import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

const ARTICLES_API = API_ENDPOINTS.ARTICLES;

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    topic: "",
    category: "",
    content: "",
    image: "",
  });

  // FETCH ARTICLES
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(ARTICLES_API);
      setArticles(res.data.articles || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // INPUT HANDLER
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // IMAGE UPLOAD (MOCKED FOR SIMPLICITY OR CONVERTED)
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app we'd upload this to S3 or convert to base64
      // For testing, we can use a standard dog image placeholder or a base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({
          ...form,
          image: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // RESET FORM
  const resetForm = () => {
    setForm({
      topic: "",
      category: "",
      content: "",
      image: "",
    });
  };

  // ADD ARTICLE
  const addArticle = async () => {
    if (!form.topic || !form.category || !form.content) return;

    try {
      const payload = {
        topic: form.topic,
        category: form.category,
        content: form.content,
        image:
          form.image ||
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
        readTime: `${Math.ceil(form.content.split(" ").length / 200)} min read`,
      };

      await axios.post(ARTICLES_API, payload);
      fetchArticles();
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Error adding article:", err);
      alert("Failed to save article");
    }
  };

  // DELETE ARTICLE
  const deleteArticle = async (id) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await axios.delete(`${ARTICLES_API}/${id}`);
      fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
    }
  };

  // CANCEL MODAL
  const handleCancel = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/10 dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF] flex items-center justify-center">
              <Plus size={17} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A2BE2] dark:text-[#C77DFF]">
              Content Library
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            Care Articles & Guides
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">
            Author and publish educational pet dermatology guides for owners.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-[#3A0070] to-[#8A2BE2] hover:brightness-110 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Article
        </button>
      </div>

      {/* ARTICLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 dark:text-slate-400 py-20 text-sm">
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-slate-400 py-20 text-sm">
            No articles yet. Click "Add Article" to create one.
          </div>
        ) : (
          articles.map((a) => (
            <div
              key={a._id}
              className="rounded-2xl overflow-hidden border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between transition hover:-translate-y-0.5 duration-200"
            >
              <div>
                <img
                  src={
                    a.image ||
                    "https://images.unsplash.com/photo-1543466835-00a7907e9de1"
                  }
                  className="w-full aspect-[16/9] object-cover"
                  alt=""
                />

                <div className="p-5 space-y-2.5">
                  <h2 className="font-bold text-base text-gray-950 dark:text-white leading-snug">
                    {a.topic}
                  </h2>

                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF] px-2.5 py-0.5 rounded-full font-semibold border border-purple-200/50 dark:border-purple-700/40">
                      {a.category}
                    </span>
                    <button
                      onClick={() => deleteArticle(a._id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {a.content}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-[#E8DDF5] dark:border-[#2E1A4E] bg-gray-50/70 dark:bg-[#1A0F32]/60 flex justify-between items-center">
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                  {a.readTime || "5 min read"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                  {new Date(a.date || a.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF8FF] dark:bg-[#160D2B] border border-[#E8DDF5] dark:border-[#2E1A4E] w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />

            <h2 className="text-lg font-bold text-gray-950 dark:text-white">
              Add New Care Article
            </h2>

            <div className="space-y-3">
              {/* TOPIC */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Article Topic
                </label>
                <input
                  name="topic"
                  placeholder="e.g. Recognizing Canine Skin Infections"
                  value={form.topic}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Category
                </label>
                <input
                  name="category"
                  placeholder="e.g. Skin Care / Health"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
              </div>

              {/* CONTENT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Content
                </label>
                <textarea
                  name="content"
                  placeholder="Write article details and instructions..."
                  value={form.content}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30 h-24 resize-none"
                />
              </div>

              {/* IMAGE */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Cover Image
                </label>
                <input
                  type="file"
                  onChange={handleImage}
                  className="text-xs text-gray-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#8A2BE2] file:text-white hover:file:bg-[#710b9d] cursor-pointer"
                />
              </div>

              {form.image && (
                <img
                  src={form.image}
                  className="w-full aspect-[16/9] object-cover rounded-xl border border-[#E8DDF5] dark:border-[#2E1A4E]"
                  alt="preview"
                />
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 dark:border-[#3D1A6E] text-gray-600 dark:text-slate-200 hover:bg-[#F5F0FA] dark:hover:bg-[#1E1040] transition text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addArticle}
                className="w-1/2 bg-gradient-to-r from-[#3A0070] to-[#8A2BE2] hover:brightness-110 text-white py-2.5 rounded-xl transition text-xs font-semibold shadow-sm"
              >
                Save Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
