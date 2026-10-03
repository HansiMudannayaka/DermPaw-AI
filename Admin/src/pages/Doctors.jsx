import { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, Trash2, Edit, Search } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

const USERS_API = API_ENDPOINTS.USERS;
const REGISTER_API = API_ENDPOINTS.AUTH_REGISTER;

export default function VetDoctors() {
  const [vets, setVets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(true);

  const [editingVet, setEditingVet] = useState({
    username: "",
    password: "",
    name: "Dr. ",
    email: "",
    specialization: "",
    experience: "",
    licenseNo: "",
  });

  const [errors, setErrors] = useState({});

  // ================= LOAD =================
  const fetchVets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(USERS_API);
      // Filter only doctors (if role exists in your API)
      const doctors = res.data.filter(
        (user) => user.role === "doctor" || !user.role,
      );
      setVets(doctors || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  // ================= SEARCH =================
  const filteredVets = vets.filter((vet) => {
    const k = search.toLowerCase();
    return (
      vet.username?.toLowerCase().includes(k) ||
      vet.name?.toLowerCase().includes(k) ||
      vet.email?.toLowerCase().includes(k) ||
      vet.specialization?.toLowerCase().includes(k) ||
      vet.licenseNo?.toLowerCase().includes(k)
    );
  });

  // ================= VALIDATION =================
  const validate = () => {
    let temp = {};

    if (!editingVet.username || editingVet.username.length < 3) {
      temp.username = "Username must be at least 3 characters";
    }

    if (!editingVet.password || editingVet.password.length < 6) {
      temp.password = "Password must be at least 6 characters";
    }

    if (!editingVet.name || editingVet.name.trim() === "Dr.") {
      temp.name = "Name must include doctor name";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!editingVet.email) {
      temp.email = "Email is required";
    } else if (!emailRegex.test(editingVet.email)) {
      temp.email = "Enter valid email (example@gmail.com)";
    }

    if (!editingVet.specialization) {
      temp.specialization = "Specialization is required";
    }

    if (!editingVet.experience) {
      temp.experience = "Experience is required";
    }

    if (!editingVet.licenseNo) {
      temp.licenseNo = "License number is required";
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  // ================= ADD USING REGISTER API =================
  const handleAdd = () => {
    setIsAddMode(true);
    setEditingVet({
      username: "Dr.",
      password: "",
      name: "Dr. ",
      email: "",
      specialization: "",
      experience: "",
      licenseNo: "",
      role: "doctor", // Added role field
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // ================= EDIT =================
  const handleEdit = (vet) => {
    setIsAddMode(false);
    setEditingVet(vet);
    setErrors({});
    setIsModalOpen(true);
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${USERS_API}/${id}`);
      fetchVets();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= SAVE (WITH SEPARATE ADD/EDIT LOGIC) =================
  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      username: editingVet.username,
      password: editingVet.password,
      name: editingVet.name.startsWith("Dr.")
        ? editingVet.name
        : "Dr. " + editingVet.name,
      email: editingVet.email,
      specialization: editingVet.specialization,
      experience: editingVet.experience,
      licenseNo: editingVet.licenseNo,
      role: "doctor", // Set role as doctor for registration
    };

    try {
      if (isAddMode) {
        // Use REGISTER_API for adding new vets
        await axios.post(REGISTER_API, payload);
      } else {
        // Use USERS_API for editing existing vets
        const updatePayload = { ...payload };
        delete updatePayload.password; // Remove password if not being updated
        if (editingVet.password && editingVet.password.length >= 6) {
          updatePayload.password = editingVet.password;
        }
        await axios.put(`${USERS_API}/${editingVet._id}`, updatePayload);
      }

      setIsModalOpen(false);

      // Reset form
      setEditingVet({
        username: "",
        password: "",
        name: "Dr. ",
        email: "",
        specialization: "",
        experience: "",
        licenseNo: "",
      });

      fetchVets();
    } catch (err) {
      console.log("Error:", err.response?.data || err.message);
      // Show error message to user
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/10 dark:bg-[#8A2BE2]/20 text-[#8A2BE2] dark:text-[#C77DFF] flex items-center justify-center">
              <UserPlus size={17} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A2BE2] dark:text-[#C77DFF]">
              Clinical Staff
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            Veterinary Doctors
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">
            Manage certified veterinary physicians and consultation credentials.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="bg-gradient-to-r from-[#3A0070] to-[#8A2BE2] hover:brightness-110 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={16} />
          Add Doctor
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative w-full md:w-80">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
          size={16}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors by name, email..."
          className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30 placeholder:text-gray-400 dark:placeholder:text-slate-400 transition"
        />
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-gray-200/90 dark:border-purple-500/25 bg-[#FAF8FF] dark:bg-[#160D2B] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(138,43,226,0.10),0_10px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />

        <div className="p-5 border-b border-[#E8DDF5] dark:border-[#2E1A4E] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-gray-950 dark:text-white">
              Active Medical Practitioners
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-300 mt-0.5">
              Licensed doctors registered in the DermPaw telehealth ecosystem
            </p>
          </div>
          <span className="text-xs font-semibold bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF] px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-700/40">
            {filteredVets.length} Doctors
          </span>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DDF5] dark:border-[#2E1A4E]">
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Username
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Name
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Email
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Experience
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  License
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8DDF5] dark:divide-[#2E1A4E]">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-8 text-gray-500 dark:text-slate-400 text-sm"
                  >
                    Loading vet doctors...
                  </td>
                </tr>
              ) : filteredVets.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-8 text-gray-500 dark:text-slate-400 text-sm"
                  >
                    No vet doctors found
                  </td>
                </tr>
              ) : (
                filteredVets.map((vet) => (
                  <tr
                    key={vet._id}
                    className="hover:bg-[#F5F0FA]/60 dark:hover:bg-[#4B0082]/10 transition text-sm text-gray-900 dark:text-white"
                  >
                    <td className="py-3.5 font-semibold text-[#710b9d] dark:text-[#C77DFF]">
                      {vet.username}
                    </td>
                    <td className="py-3.5 font-medium">{vet.name}</td>
                    <td className="py-3.5 text-gray-600 dark:text-slate-300">
                      {vet.email}
                    </td>
                    <td className="py-3.5">
                      <span className="bg-[#F3E8FF] dark:bg-[#4B0082]/30 text-[#710b9d] dark:text-[#C77DFF] px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {vet.specialization}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-600 dark:text-slate-300">
                      {vet.experience}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-gray-600 dark:text-slate-300">
                      {vet.licenseNo}
                    </td>
                    <td className="py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vet)}
                          className="p-1.5 rounded-lg hover:bg-[#F3E8FF] dark:hover:bg-[#8A2BE2]/20 text-[#710b9d] dark:text-[#C77DFF] transition"
                          title="Edit Vet"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(vet._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                          title="Delete Vet"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8FF] dark:bg-[#160D2B] border border-[#E8DDF5] dark:border-[#2E1A4E] p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A0070] via-[#8A2BE2] to-[#C77DFF]" />
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">
              {isAddMode ? "Add New Doctor" : "Edit Doctor Profile"}
            </h2>

            <div className="space-y-3">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Username
                </label>
                <input
                  placeholder="e.g. Dr.John"
                  value={editingVet.username}
                  onChange={(e) =>
                    setEditingVet({ ...editingVet, username: e.target.value })
                  }
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
                {errors.username && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder={
                    isAddMode
                      ? "Min 6 characters"
                      : "Leave blank to keep current password"
                  }
                  value={editingVet.password}
                  onChange={(e) =>
                    setEditingVet({ ...editingVet, password: e.target.value })
                  }
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
                {errors.password && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Full Name
                </label>
                <input
                  placeholder="Dr. Full Name"
                  value={editingVet.name}
                  onChange={(e) =>
                    setEditingVet({ ...editingVet, name: e.target.value })
                  }
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  Email
                </label>
                <input
                  placeholder="doctor@example.com"
                  value={editingVet.email}
                  onChange={(e) =>
                    setEditingVet({ ...editingVet, email: e.target.value })
                  }
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
                {errors.email && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Specialization & Experience */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    Specialization
                  </label>
                  <input
                    placeholder="e.g. Dermatology"
                    value={editingVet.specialization}
                    onChange={(e) =>
                      setEditingVet({
                        ...editingVet,
                        specialization: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    Experience
                  </label>
                  <input
                    placeholder="e.g. 5 Years"
                    value={editingVet.experience}
                    onChange={(e) =>
                      setEditingVet({
                        ...editingVet,
                        experience: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                  />
                  {errors.experience && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.experience}
                    </p>
                  )}
                </div>
              </div>

              {/* License */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                  License No
                </label>
                <input
                  placeholder="e.g. VET-2026-88"
                  value={editingVet.licenseNo}
                  onChange={(e) =>
                    setEditingVet({ ...editingVet, licenseNo: e.target.value })
                  }
                  className="w-full border border-gray-200 dark:border-[#3D1A6E] bg-[#FAF8FF] dark:bg-[#1A0F32] text-gray-800 dark:text-slate-100 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/30"
                />
                {errors.licenseNo && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.licenseNo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#3D1A6E] text-gray-600 dark:text-slate-200 hover:bg-[#F5F0FA] dark:hover:bg-[#1E1040] transition text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-[#3A0070] to-[#8A2BE2] hover:brightness-110 text-white rounded-xl transition text-xs font-semibold shadow-sm"
              >
                Save Doctor Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
