import { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, Trash2, Edit, Search } from "lucide-react";

// Changed API endpoints
const USERS_API = "http://172.20.10.4:5000/api/users";
const REGISTER_API = "http://172.20.10.4:5000/api/auth/register";

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
      const doctors = res.data.filter(user => user.role === "doctor" || !user.role);
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
      username: "",
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
    <div className="p-4 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🐶 Vet Doctors</h1>
          <p className="text-gray-500 text-sm">
            Manage veterinary doctors (API Connected)
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add Vet
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vets..."
          className="w-full border pl-10 pr-3 py-2 rounded-xl"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Specialization</th>
              <th className="p-4">Experience</th>
              <th className="p-4">License</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : filteredVets.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-400">
                  No vets found 🐶
                </td>
              </tr>
            ) : (
              filteredVets.map((vet) => (
                <tr key={vet._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{vet.username}</td>
                  <td className="p-4">{vet.name}</td>
                  <td className="p-4">{vet.email}</td>
                  <td className="p-4">{vet.specialization}</td>
                  <td className="p-4">{vet.experience}</td>
                  <td className="p-4">{vet.licenseNo}</td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(vet)}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(vet._id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[420px] space-y-3">
            <h2 className="text-xl font-bold">
              {isAddMode ? "Add Vet" : "Edit Vet"}
            </h2>

            {/* Username */}
            <input
              placeholder="Username"
              value={editingVet.username}
              onChange={(e) =>
                setEditingVet({ ...editingVet, username: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}

            {/* Password - Only required for Add mode */}
            <input
              type="password"
              placeholder={isAddMode ? "Password" : "Password (leave blank to keep current)"}
              value={editingVet.password}
              onChange={(e) =>
                setEditingVet({ ...editingVet, password: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

            {/* Name */}
            <input
              placeholder="Name"
              value={editingVet.name}
              onChange={(e) =>
                setEditingVet({ ...editingVet, name: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}

            {/* Email */}
            <input
              placeholder="Email"
              value={editingVet.email}
              onChange={(e) =>
                setEditingVet({ ...editingVet, email: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

            {/* Specialization */}
            <input
              placeholder="Specialization"
              value={editingVet.specialization}
              onChange={(e) =>
                setEditingVet({ ...editingVet, specialization: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.specialization && (
              <p className="text-red-500 text-xs">{errors.specialization}</p>
            )}

            {/* Experience */}
            <input
              placeholder="Experience"
              value={editingVet.experience}
              onChange={(e) =>
                setEditingVet({ ...editingVet, experience: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.experience && (
              <p className="text-red-500 text-xs">{errors.experience}</p>
            )}

            {/* License */}
            <input
              placeholder="License No"
              value={editingVet.licenseNo}
              onChange={(e) =>
                setEditingVet({ ...editingVet, licenseNo: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            {errors.licenseNo && (
              <p className="text-red-500 text-xs">{errors.licenseNo}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}