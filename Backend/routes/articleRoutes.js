const express = require("express");
const router = express.Router();
const Article = require("../models/Article");
const protect = require("../middleware/authMiddleware");

// ================= CREATE ARTICLE =================
router.post("/", async (req, res) => {
  try {
    const { topic, category, content, image, readTime } = req.body;

    if (!topic || !category || !content) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const article = new Article({
      topic,
      category,
      content,
      image: image || "",
      readTime: readTime || "5 min read",
    });

    await article.save();
    return res.status(201).json({ success: true, article });
  } catch (err) {
    console.error("CREATE ARTICLE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= GET ALL ARTICLES =================
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, articles });
  } catch (err) {
    console.error("GET ARTICLES ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= DELETE ARTICLE =================
router.delete("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    await Article.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Article deleted successfully" });
  } catch (err) {
    console.error("DELETE ARTICLE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
