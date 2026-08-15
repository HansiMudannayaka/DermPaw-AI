import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";

const ARTICLES_API = "http://172.20.10.4:8000/api/articles";

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
        image: form.image || "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Articles
          </h1>
          <p className="text-gray-500 text-sm">
            Create and manage pet care articles (API Connected)
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Article
        </button>

      </div>

      {/* ARTICLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-20">
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-20">
            No articles yet. Click "Add Article" to create one.
          </div>
        ) : (
          articles.map((a) => (
            <div
              key={a._id}
              className="bg-white rounded-2xl overflow-hidden shadow flex flex-col justify-between"
            >
              <div>
                <img
                  src={a.image || "https://images.unsplash.com/photo-1543466835-00a7907e9de1"}
                  className="w-full aspect-[16/9] object-cover"
                  alt=""
                />

                <div className="p-4 space-y-2">
                  <h2 className="font-bold text-lg">{a.topic}</h2>

                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-semibold">
                      {a.category}
                    </span>
                    <button
                      onClick={() => deleteArticle(a._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-3">
                    {a.content}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  {a.readTime || "5 min read"}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(a.date || a.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}

      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[500px] rounded-2xl p-6 space-y-4">

            <h2 className="text-xl font-bold">
              Add New Article
            </h2>

            {/* TOPIC */}
            <input
              name="topic"
              placeholder="Article Topic"
              value={form.topic}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            />

            {/* CATEGORY */}
            <input
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            />

            {/* CONTENT */}
            <textarea
              name="content"
              placeholder="Write content..."
              value={form.content}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl h-28"
            />

            {/* IMAGE */}
            <input type="file" onChange={handleImage} />

            {form.image && (
              <img
                src={form.image}
                className="w-full aspect-[16/9] object-cover rounded-xl"
                alt="preview"
              />
            )}

            {/* BUTTONS */}
            <div className="flex gap-3 pt-2">

              {/* ❌ CANCEL */}
              <button
                onClick={handleCancel}
                className="w-1/2 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300"
              >
                Cancel
              </button>

              {/* ✅ SAVE */}
              <button
                onClick={addArticle}
                className="w-1/2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700"
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