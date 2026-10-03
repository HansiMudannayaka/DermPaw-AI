const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminProtect = require("../middleware/adminMiddleware");
const User = require("../models/User");
const Pet = require("../models/Pet");
const Scan = require("../models/Scan");
const Consultation = require("../models/Consultation");

// All admin routes must be protected and restricted to admin
// router.use(protect, adminProtect); // TODO: Re-enable when Admin Login is built on frontend!

// ================= ADMIN DASHBOARD STATS =================
router.get("/dashboard", async (req, res) => {
  try {
    // 1. Get total counts
    const totalUsers = await User.countDocuments({ role: "owner" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalPets = await Pet.countDocuments();
    const totalScans = await Scan.countDocuments();
    const totalDetections = await Scan.countDocuments({ disease: { $ne: "healthy" } });
    
    // Real count of approved consultations/reviews
    const totalReviews = await Consultation.countDocuments({ status: "approved" });

    // 2. Get Disease Distribution
    const diseaseDistribution = await Scan.aggregate([
      { $group: { _id: "$disease", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const distributionMap = {};
    diseaseDistribution.forEach(item => {
      distributionMap[item._id] = item.count;
    });

    // 3. Get Recent Activity (Latest 5 Scans)
    const recentScans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("pet", "name")
      .populate("owner", "name");

    const recentActivity = recentScans.map(scan => {
      let color = "text-purple-500";
      if (scan.disease === "healthy") color = "text-green-500";
      else if (scan.status === "danger") color = "text-red-500";
      else if (scan.status === "warning") color = "text-orange-500";

      return {
        pet: scan.petName || (scan.pet && scan.pet.name) || "Unknown",
        action: scan.disease === "healthy" ? "Healthy" : `${scan.disease} Detected`,
        time: scan.createdAt,
        color
      };
    });

    // 4. Trend Chart (Daily / Weekly / Monthly)
    const period = (req.query.period || "daily").toLowerCase();
    const now = new Date();
    let startDate = new Date();
    let groupFormat = "%Y-%m-%d";

    if (period === "weekly") {
      startDate.setDate(now.getDate() - 28); // last 4 weeks
      groupFormat = "%Y-W%V";
    } else if (period === "monthly") {
      startDate.setMonth(now.getMonth() - 6); // last 6 months
      groupFormat = "%Y-%m";
    } else {
      // daily (default)
      startDate.setDate(now.getDate() - 7); // last 7 days
      groupFormat = "%Y-%m-%d";
    }

    const trendData = await Scan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      period,
      stats: {
        totalUsers,
        totalPets,
        totalScans,
        totalDetections,
        totalDoctors,
        totalReviews
      },
      diseaseDistribution: distributionMap,
      recentActivity,
      trendData
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching dashboard stats" });
  }
});

// ================= ADMIN PREDICTIONS =================
router.get("/predictions", async (req, res) => {
  try {
    const totalPredictions = await Scan.countDocuments();
    const accuracyRate = "95.42%";

    const [scans, consultations] = await Promise.all([
      Scan.find().sort({ createdAt: -1 }).populate("pet", "name"),
      Consultation.find().sort({ createdAt: -1 }).populate("doctor", "name email specialization")
    ]);

    const predictions = scans.map((scan) => {
      const scanTime = new Date(scan.createdAt).getTime();

      // Find matching consultation for this scan
      const matchingConsult = consultations.find((c) => {
        const consultTime = new Date(c.createdAt).getTime();
        const samePet =
          (c.pet && scan.pet && c.pet.toString() === scan.pet.toString()) ||
          (c.petName && scan.petName && c.petName.trim().toLowerCase() === scan.petName.trim().toLowerCase());
        
        // Match if same pet within 1 hour or exact same disease
        const sameDisease =
          c.aiResult &&
          c.aiResult.disease &&
          scan.disease &&
          c.aiResult.disease.trim().toLowerCase() === scan.disease.trim().toLowerCase();
        
        const timeDiff = Math.abs(consultTime - scanTime);
        return samePet && (sameDisease || timeDiff <= 3600000);
      });

      let reviewStatus = "Pending";
      let riskStatus = "Pending";
      let doctorName = null;
      let doctorAdvice = "";

      if (matchingConsult) {
        if (matchingConsult.doctor && matchingConsult.doctor.name) {
          doctorName = matchingConsult.doctor.name;
        }
        doctorAdvice = matchingConsult.advice || "";

        if (matchingConsult.status === "approved") {
          reviewStatus = "Reviewed";

          // Extract severity from doctor's advice
          const severityMatch = doctorAdvice.match(/Severity:\s*([a-zA-Z]+)/i);
          if (severityMatch) {
            const sev = severityMatch[1].toLowerCase();
            if (sev === "severe" || sev === "high") riskStatus = "High Risk";
            else if (sev === "moderate" || sev === "medium") riskStatus = "Medium Risk";
            else if (sev === "mild" || sev === "low") riskStatus = "Low Risk";
            else riskStatus = "Safe";
          } else {
            // Default risk from scan status if doctor approved without explicit severity tag
            if (scan.status === "danger") riskStatus = "High Risk";
            else if (scan.status === "warning") riskStatus = "Medium Risk";
            else if (scan.disease.toLowerCase() !== "healthy") riskStatus = "Medium Risk";
            else riskStatus = "Safe";
          }
        } else if (matchingConsult.status === "rejected") {
          reviewStatus = "Rejected";
          riskStatus = "Safe";
        } else {
          reviewStatus = "Pending";
          riskStatus = "Pending";
        }
      } else {
        // No consultation requested/completed yet -> Pending review
        reviewStatus = "Pending";
        riskStatus = "Pending";
      }

      return {
        id: scan._id,
        pet: scan.petName || (scan.pet && scan.pet.name) || "Unknown",
        disease: scan.disease.charAt(0).toUpperCase() + scan.disease.slice(1),
        confidence: scan.confidence || 90,
        status: riskStatus,
        reviewStatus,
        doctor: doctorName,
        doctorAdvice,
        aiInitialStatus: scan.status,
        time: new Date(scan.createdAt).toLocaleString(),
      };
    });

    const highRiskCases = predictions.filter((p) => p.status === "High Risk").length;
    const pendingReviews = predictions.filter((p) => p.reviewStatus === "Pending").length;

    return res.status(200).json({
      success: true,
      stats: {
        totalPredictions,
        highRiskCases,
        pendingReviews,
        accuracyRate,
      },
      predictions,
    });
  } catch (err) {
    console.error("PREDICTIONS FETCH ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching predictions" });
  }
});

// ================= ADMIN REPORTS =================
router.get("/reports", async (req, res) => {
  try {
    const totalReports = await Scan.countDocuments();
    const detectedCases = await Scan.countDocuments({ disease: { $ne: "healthy" } });
    const systemHealth = "Stable";
    const growthRate = "+18%";

    const recentScans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("pet", "name");

    const recentActivities = recentScans.map((scan) => {
      const petName = scan.petName || (scan.pet && scan.pet.name) || "Pet";
      const diseaseName = scan.disease.charAt(0).toUpperCase() + scan.disease.slice(1);
      return `🐶 ${petName} scan completed — ${diseaseName} ${scan.disease === "healthy" ? "result" : "detected"}`;
    });

    return res.status(200).json({
      success: true,
      reports: [
        { title: "Total Reports", value: totalReports.toLocaleString(), iconType: "fileText", color: "bg-blue-100 text-blue-600" },
        { title: "Detected Cases", value: detectedCases.toLocaleString(), iconType: "alertTriangle", color: "bg-red-100 text-red-600" },
        { title: "System Health", value: systemHealth, iconType: "activity", color: "bg-green-100 text-green-600" },
        { title: "Growth Rate", value: growthRate, iconType: "trendingUp", color: "bg-purple-100 text-purple-600" },
      ],
      recentActivities,
    });
  } catch (err) {
    console.error("REPORTS FETCH ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching reports" });
  }
});

module.exports = router;
