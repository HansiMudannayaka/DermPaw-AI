import { useState } from "react";
import { Plus } from "lucide-react";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    topic: "",
    category: "",
    content: "",
    image: "",
  });

  // INPUT HANDLER
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // IMAGE UPLOAD
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        image: URL.createObjectURL(file),
      });
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
  const addArticle = () => {
    if (!form.topic || !form.category || !form.content) return;

    const newArticle = {
      id: Date.now(),
      ...form,
      date: new Date().toLocaleDateString(),
    };

    setArticles([newArticle, ...articles]);

    resetForm();
    setOpen(false);
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
            Create and manage pet care articles
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

        {articles.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-20">
            No articles yet. Click "Add Article" to create one.
          </div>
        )}

        {articles.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl overflow-hidden shadow"
          >

            <img
              src={a.image}
              className="w-full aspect-[16/9] object-cover"
              alt=""
            />

            <div className="p-4 space-y-2">

              <h2 className="font-bold text-lg">{a.topic}</h2>

              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                {a.category}
              </span>

              <p className="text-sm text-gray-500 line-clamp-3">
                {a.content}
              </p>

              <p className="text-xs text-gray-400">
                {a.date}
              </p>

            </div>
          </div>
        ))}

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