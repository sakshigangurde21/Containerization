import { useEffect, useState, useRef } from "react";
import { getDevices, addDevice, deleteDevice, updateDevice } from "./services/deviceService";
import * as signalR from "@microsoft/signalr";
import { Toaster, toast } from "react-hot-toast";
import { InputAdornment } from "@mui/material";
import { FaBell, FaEye, FaEyeSlash } from "react-icons/fa";
import {
  Avatar, Menu, MenuItem, Box, Grid, Stack, Typography, TextField, Button,
  Paper, IconButton, Drawer, Badge, List, ListItem, ListItemText
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { FaEdit, FaTrash, FaLayerGroup, FaUndo} from "react-icons/fa";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import ClickAwayListener from "@mui/material/ClickAwayListener";


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const API_ROOT = API_BASE_URL.replace(/\/api$/, ""); // Remove /api suffix for auth endpoints

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);


  const [loginErrors, setLoginErrors] = useState({ username: "", password: "", general: "" });
  const [registerErrors, setRegisterErrors] = useState({ username: "", password: "", confirmPassword: "", general: "" });

  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [touched, setTouched] = useState(false);
  const [editTouched, setEditTouched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const MAX_DEVICE_NAME_LENGTH = 100;
  const USERNAME_MIN = 2;
  const USERNAME_MAX = 20;
  const PASSWORD_MIN = 6;
  const PASSWORD_MAX = 16;
  const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

const signalRConnection = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

const [snackbarOpen, setSnackbarOpen] = useState(false);
const [deletedDevice, setDeletedDevice] = useState(null);

const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [deviceToDelete, setDeviceToDelete] = useState(null);

const [showAddBox, setShowAddBox] = useState(false);
const [addDialogOpen, setAddDialogOpen] = useState(false);

const [editDialogOpen, setEditDialogOpen] = useState(false);

const [filterDeviceName, setFilterDeviceName] = useState("");
const [filterDescription, setFilterDescription] = useState("");
const [filterUsername, setFilterUsername] = useState(""); // Admin only

const [searchField, setSearchField] = useState("deviceName"); // default search field
const [searchQuery, setSearchQuery] = useState("");

const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
const [deviceToRestore, setDeviceToRestore] = useState(null);

const [activeDevices, setActiveDevices] = useState([]);
const [deletedDevices, setDeletedDevices] = useState([]);

const [currentPageView, setCurrentPageView] = useState("active"); // "active" | "deleted"

const [unreadCount, setUnreadCount] = useState(0);

const loadUnreadCount = async () => {
  try {
      const resp = await fetchWithRefresh(`${API_BASE_URL}/device/notifications/unread-count`, {
      method: "GET",
    });
    if (resp.ok) {
      const data = await resp.json();
      setUnreadCount(data.count || 0);
    }
  } catch (err) {
    console.error("Failed to load unread count", err);
  }
};

const markAsRead = async (id) => {
  try {
      await fetch(`${API_BASE_URL}/device/notifications/markread/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  } catch (err) {
    console.error("Failed to mark notification as read", err);
  }
};

const markAllRead = async () => {
  try {
      await fetch(`${API_BASE_URL}/device/notifications/markallread`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  } catch (err) {
    console.error("Failed to mark all notifications read", err);
  }
};

const clearAll = () => {
  setNotifications([]);
};




  // ---- VALIDATION ----
const validateInputs = (isLogin = false) => {
  const errs = { username: "", password: "", confirmPassword: "", general: "" };
  const name = username.trim();
  const pass = password;

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const invalidChars = /[^a-zA-Z0-9._-]/; 
  const consecutiveSpecials = /[._-]{2,}/;

  // ---- USERNAME ----
  if (!name) {
    errs.username = "Username is required";
  } else {
    if (emojiRegex.test(name)) errs.username = "Emojis are not allowed";
    else if (invalidChars.test(name)) errs.username = "Only letters, numbers, dot, underscore, and dash allowed";
    else if (consecutiveSpecials.test(name)) errs.username = "No consecutive special characters allowed";
    else if (/^[._-]/.test(name)) errs.username = "Cannot start with special character";
    else if (/[._-]$/.test(name)) errs.username = "Cannot end with special character";
    else if (name.length < USERNAME_MIN || name.length > USERNAME_MAX)
      errs.username = `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`;
  }

  // ---- PASSWORD ----
  if (!pass) {
    errs.password = "Password is required";
  } else {
    if (emojiRegex.test(pass)) errs.password = "Emojis are not allowed";
    else if (pass.length < PASSWORD_MIN || pass.length > PASSWORD_MAX)
      errs.password = `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`;
    else if (!/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/\d/.test(pass) || !/[!@#$%^&*]/.test(pass))
      errs.password = "Password must include uppercase, lowercase, number, and special character";
  }

  // ---- CONFIRM PASSWORD ----
  if (!isLogin) {
    if (confirmPassword !== password)
      errs.confirmPassword = "Passwords do not match";
  }

  return errs;
};


  // ---- LOGIN ----
  const handleLogin = async () => {
    const errs = validateInputs(true);
    setLoginErrors(errs);
    if (errs.username || errs.password) return;

    try {
        const resp = await fetch(`${API_ROOT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: "include", // important for cookies
      });
      const data = await resp.json();

      if (resp.ok) {
        setUsername(data.username);
        setUserRole(data.role);
        setCurrentUserId(data.userId); 
        console.log(data)
        setRole(data.role )
        localStorage.setItem("user", JSON.stringify( {"username" : data.username,"role": data.role}))
        toast.success("Logged in successfully");
        // after storing user in localStorage
await loadDevices();
await loadNotifications();
      } else {
        setLoginErrors({ username: "", password: "", general: data?.message || "Login failed" });
        toast.error(data?.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setLoginErrors({ username: "", password: "", general: "Server error" });
      toast.error("Login failed due to server error");
    }
  };

  // ---- REGISTER ----
  const handleRegister = async () => {
    const errs = validateInputs(false);
    setRegisterErrors(errs);
    if (errs.username || errs.password || errs.confirmPassword) return;

    try {
        const resp = await fetch(`${API_ROOT}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role: "User" }),
      });
      const data = await resp.json();

      if (resp.ok) {
        toast.success(data.message || "Registered successfully! Please log in.");
        setIsRegister(false);
        setRegisterErrors({ username: "", password: "", confirmPassword: "", general: "" });
        setUsername(""); setPassword(""); setConfirmPassword("");
      } else {
        setRegisterErrors({ ...errs, general: data?.message || "Registration failed" });
        toast.error(data?.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setRegisterErrors({ ...errs, general: "Server error" });
      toast.error("Registration failed due to server error");
    }
  };

  const handleInputChange = (field, value, isRegisterForm = false) => {
    if (field === "username") setUsername(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    const errs = isRegisterForm ? { ...registerErrors } : { ...loginErrors };
    if (field === "username") errs.username = value.trim() ? "" : "Username is required";
    if (field === "password") errs.password = value ? "" : "Password is required";
    if (field === "confirmPassword") errs.confirmPassword = value ? "" : "Confirm password is required";
    isRegisterForm ? setRegisterErrors(errs) : setLoginErrors(errs);
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    try {
        await fetch(`${API_ROOT}/api/auth/logout`, {
        method: "POST",
        credentials: "include", // send cookie
      });
      localStorage.removeItem("user");
      setUsername("");
       setRole("");
      setUserRole(null);
      toast("Logged out successfully.", { icon: "👋" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to logout");
    }
  };

  // ---- LOAD DEVICES ----

const loadDevices = async () => {
  try {
    const storeUser = JSON.parse(localStorage.getItem("user"));
    const isAdmin = storeUser?.role === "Admin";

    // Active devices
      const respActive = await fetchWithRefresh(`${API_BASE_URL}/device?deleted=false`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!respActive.ok) {
      console.error("Failed to fetch active devices", respActive.status, await safeText(respActive));
      setActiveDevices([]);
    } else {
      const activeData = await respActive.json();
      setActiveDevices(Array.isArray(activeData) ? activeData.map(d => ({ ...d, isDeleted: false })) : []);
    }

    // Deleted devices (admin)
    if (isAdmin) {
        const respDeleted = await fetchWithRefresh(`${API_BASE_URL}/device?deleted=true`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!respDeleted.ok) {
        console.error("Failed to fetch deleted devices", respDeleted.status, await safeText(respDeleted));
        setDeletedDevices([]);
      } else {
        const deletedData = await respDeleted.json();
        console.log("Deleted devices fetched:", deletedData);
        setDeletedDevices(Array.isArray(deletedData) ? deletedData.map(d => ({ ...d, isDeleted: true })) : []);
      }
    } else {
      setDeletedDevices([]); // clear for non-admin
    }
  } catch (err) {
    console.error("loadDevices error:", err);
    toast.error("Failed to load devices");
    setActiveDevices([]);
    setDeletedDevices([]);
  }
};

// helper to get text safely (avoids exception on non-json responses)
async function safeText(resp) {
  try { return await resp.text(); } catch { return "<no body>"; }
}




 const loadNotifications = async () => {
  try {
      const resp = await fetchWithRefresh(`${API_BASE_URL}/device/notifications`, {
      method: "GET" });
    if (resp.ok) {
      const data = await resp.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length); // sync badge
    }
  } catch (err) {
    console.error("Failed to load notifications", err);
    toast.error("Failed to load notifications");
  }
};




  useEffect(() => {
  const checkUserSession = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      setRole(""); // no user -> show login
      return;
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/device`, {
        method: "GET",
        credentials: "include"
      });

      if (resp.ok) {
        setRole(storedUser.role);
        loadDevices();
        loadNotifications();
      } else {
        // cookie expired or invalid -> force logout
        localStorage.removeItem("user");
        setRole("");
      }
    } catch {
      localStorage.removeItem("user");
      setRole("");
    }
  };

  checkUserSession();
}, []);

  async function fetchWithRefresh(url, options = {}) {
  try {
    // Try original request
    const resp = await fetch(url, { ...options, credentials: "include" });
    
    if (resp.status === 401) {
      // JWT expired, try refreshing
        const refreshResp = await fetch(`${API_ROOT}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResp.ok) {
        // Retry original request after refresh
        return await fetch(url, { ...options, credentials: "include" });
      } else {
        // Refresh token expired → force logout
        localStorage.removeItem("user");
        window.location.reload();
        return Promise.reject("Session expired. Logged out.");
      }
    }

    return resp; // Normal response if not 401
  } catch (err) {
    return Promise.reject(err);
  }
}


  // ---- SIGNALR CONNECTION ----
  useEffect(() => {
    const storeUser = JSON.parse(localStorage.getItem("user"));
    if (!storeUser || !storeUser.role) return;

    setRole(storeUser.role);
    loadDevices();
    loadNotifications();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ROOT}/deviceHub`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    signalRConnection.current = connection;

 connection.on("DeviceAdded", async (data) => {
  console.log("SignalR data:", data);
  toast.success(`${data.AddedBy || data.addedBy} added device "${data.DeviceName || data.deviceName}"`);
  if (data.userId === currentUserId) {
    await loadDevices();
    loadNotifications();
  }
});

connection.on("DeviceUpdated", async (data) => {
  console.log("SignalR data:", data);
  toast.success(`${data.UpdatedBy || data.updatedBy} updated device "${data.DeviceName || data.deviceName}"`);
  await loadDevices();
  loadNotifications();
});

    connection.on("DeviceDeleted", async () => { toast.success("Device deleted"); await loadDevices(); loadNotifications(); });

connection.on("NewNotification", async (notif) => {
  console.log("New notification received:", notif);
  
  // Format the notification properly
  const formattedNotif = {
    id: notif.Id || notif.id,
    message: notif.Message || notif.message,
    createdAt: notif.CreatedAt || notif.createdAt,
    isRead: false
  };
  
  toast.success(notif.Message || notif.message || "New notification");
  setNotifications(prev => [formattedNotif, ...prev]);
  setUnreadCount(prev => prev + 1);
});

// ✅ SEPARATE LISTENER - Move this OUTSIDE
connection.on("DeviceRestored", async (data) => {
  console.log("SignalR DeviceRestored data:", data);
  toast.success(`Device "${data.DeviceName || data.deviceName}" restored`);
  await loadDevices();
  await loadNotifications();
});

  
 

// <-- Add this listener
connection.on("ReceiveAverage", (data) => {
  console.log("ReceiveAverage event received:", data);
  toast.success(`Average of ${data.column}: ${data.average}`);
});

    connection.onreconnecting(() => { setConnectionStatus("reconnecting"); toast("Reconnecting..."); });
    connection.onreconnected(() => { setConnectionStatus("connected"); toast.success("Reconnected"); });
    connection.onclose(() => { setConnectionStatus("disconnected"); toast.error("Disconnected"); });

    connection.start().then(() => setConnectionStatus("connected")).catch(err => { console.error(err); setConnectionStatus("disconnected"); });

    return () => connection.stop();
  }, [userRole]);

  // ---- DEVICE VALIDATION ----
  const validateName = (name, excludeId = null) => {
  const trimmed = name.trim();
  if (!trimmed) return "Device name is required";
  if (trimmed.length > MAX_DEVICE_NAME_LENGTH) return `Device name cannot exceed ${MAX_DEVICE_NAME_LENGTH} characters`;
  if (/^\d+$/.test(trimmed)) return "Device name cannot be only numbers";
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return "Invalid characters";
  if (!/[a-zA-Z]/.test(trimmed)) return "Device name must contain at least one letter";
  if (/^[ _-]/.test(trimmed)) return "Device name cannot start with special characters";
  if (/[ _-]$/.test(trimmed)) return "Device name cannot end with special characters";
  
  // Consecutive special characters check
  if (/[_ -]{2,}/.test(trimmed)) return "Device name cannot contain consecutive special characters";

  // Duplicate check
  if (activeDevices.some(d => d.deviceName.toLowerCase() === trimmed.toLowerCase() && d.id !== excludeId))
    return "Device with this name already exists";

  return "";
};



 const handleAdd = async () => {
  setTouched(true);
  const trimmedName = newDevice.trim();
  const errMsg = validateName(trimmedName);
  if (errMsg) {
    setAddError(errMsg);
    return;
  }

  try {
      const resp = await fetchWithRefresh(`${API_BASE_URL}/device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceName: trimmedName,
        description: newDescription.trim() || "No description",
      }),
    });

    if (resp.ok) {
      await loadDevices();
      await loadNotifications(); // << fetch new notifications
      setNewDevice("");
      setNewDescription("");
      setAddError("");
      setTouched(false);
      setCurrentPage(1);
      toast.success("Device added successfully");
    } else {
      const dataText = await safeText(resp);
      let data;
      try {
        data = JSON.parse(dataText);
      } catch {
        data = { message: dataText };
      }

      if (data?.message?.includes("even if deleted")) {
        // prefer server-sent deviceId, otherwise try to find by deviceName in deletedDevices:
        const serverId = data.deviceId;
        let idToRestore = serverId;
        if (!idToRestore) {
          const match = deletedDevices.find(
            (dd) =>
              dd.deviceName?.trim().toLowerCase() ===
              trimmedName.toLowerCase()
          );
          if (match) idToRestore = match.id;
        }

        setDeviceToRestore({
          id: idToRestore,
          deviceName: trimmedName,
          description: newDescription.trim(),
        });
        setRestoreDialogOpen(true);
      } else {
        toast.error(data?.message || "Failed to add device");
      }
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to add device");
  }
};


  const handleDelete = id => {
  const device = activeDevices.find(d => d.id === id);
  setDeviceToDelete(device);
  setDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  if (!deviceToDelete) return;

  try {
       const resp = await fetchWithRefresh(`${API_BASE_URL}/device/${deviceToDelete.id}`, {
       method: "DELETE" });
    if (resp.ok) {
      setDeletedDevice(deviceToDelete);
      setSnackbarOpen(true);
      await loadDevices();
      await loadNotifications();   // reload notification

    } else {
      const data = await resp.json();
      toast.error(data?.message || "Failed to delete device");
    }
  } catch {
    toast.error("Failed to delete device");
  } finally {
    setDeleteDialogOpen(false);
    setDeviceToDelete(null);
  }
};

const handleRestoreDialog = () => {
  if (!deletedDevice) return;
  if (window.confirm(`Device "${deletedDevice.deviceName}" exists but is deleted. Restore it?`)) {
    handleUndoDelete();
  }
};


  const handleEdit = d => { setEditId(d.id); setEditName(d.deviceName); setEditDescription(d.description); setEditError(""); setEditTouched(false); };
const handleCancelEdit = () => {
  setEditId(null);
  setEditName("");
  setEditDescription("");
  setEditError("");
  setEditTouched(false);
  setEditDialogOpen(false); // close dialog on cancel
};
 const handleUpdate = async () => {
  setEditTouched(true);
  const errMsg = validateName(editName, editId);
  if (errMsg) { setEditError(errMsg); return; }

  try {
      const resp = await fetchWithRefresh(`${API_BASE_URL}/device/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName: editName.trim(), description: editDescription.trim() || "No description" }),
    });

    if (resp.ok) {
      await loadDevices();
      await loadNotifications();
      setEditDialogOpen(false);
      handleCancelEdit();
    } else {
      const data = await resp.json();
      toast.error(data?.message || "Failed to update device");
    }
  } catch {
    toast.error("Failed to update device");
  }
};


  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  }

const filteredDevices = activeDevices.filter((d) => {
  if (!searchQuery) return true;

  if (role === "Admin") {
    // Admin searches only in selected field
    const value =
      searchField === "deviceName"
        ? d.deviceName
        : searchField === "description"
        ? d.description
        : d.createdBy || "";
    return value.toLowerCase().includes(searchQuery.toLowerCase());
  } else {
    // User searches in Device Name AND Description simultaneously
    return (
      d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
});

  const totalPages = Math.ceil(filteredDevices.length / pageSize);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const canSubmitRegister = !registerErrors.username && !registerErrors.password;

 // Assuming you have deletedDevice state, loadDevices function, and toast ready
const handleUndoDelete = async (id) => {
  // prefer explicit id param; if not provided, fallback to deviceToRestore
  const dev = (typeof id !== "undefined" && id !== null)
    ? deletedDevices.find(d => d.id === id) || activeDevices.find(d => d.id === id)
    : deviceToRestore;

  if (!dev || !dev.id) {
    toast.error("Cannot restore: device id not found");
    return;
  }

  try {
    const resp = await fetchWithRefresh(`${API_BASE_URL}/device/restore/${dev.id}`, {
     method: "PUT", headers: { "Content-Type": "application/json" } }
    );

    if (!resp.ok) {
      const text = await safeText(resp);
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
      toast.error(data?.message || "Failed to restore device");
      return;
    }

    toast.success("Device restored successfully");
    setDeviceToRestore(null);
    await loadDevices();
  } catch (err) {
    console.error("handleUndoDelete error:", err);
    toast.error("Something went wrong while restoring the device");
  }
};



const openEditDialog = (device) => {
  setEditId(device.id);
  setEditName(device.deviceName);
  setEditDescription(device.description);
  setEditError(validateName(device.deviceName, device.id));
  setEditDialogOpen(true);
};

const handleDrawerOpen = async () => {
  setDrawerOpen(true);

  // Mark all as read in backend
  try {
      await fetchWithRefresh(`${API_BASE_URL}/device/notifications/markallread`, {
      method: "PUT" 
    });
    
    // Reload notifications to get updated isRead status
    await loadNotifications();
    
    //  Reset unread count to 0
    setUnreadCount(0);
  } catch (err) {
    console.error("Failed to mark all read", err);
  }
};

const triggerAverageCalculation = async (columnName) => {
  try {
      const resp = await fetchWithRefresh(`${API_BASE_URL}/device/calculate-average`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnName }),
    });

    if (resp.ok) {
      const data = await resp.json();
      toast.success(data.message || `${columnName} queued for calculation`);
    } else {
      const text = await resp.text();
      toast.error(text || "Failed to trigger calculation");
    }
  } catch (err) {
    console.error(err);
    toast.error("Error triggering calculation");
  }
};





  // ---- RENDER ---
  return (
  <>
    <Toaster position="top-right" toastOptions={{ duration: 5000 }} />

    {!role ? (
      // -------- LOGIN / REGISTER --------
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: "#f3f4f6", px: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 5 },
            width: { xs: "100%", sm: 420 },
            borderRadius: 4,
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          }}
        >
          <Typography variant="h4" fontWeight="700" mb={1} color="primary">
            {isRegister ? "Create Account" : "Welcome Back!"}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => handleInputChange("username", e.target.value, isRegister)}
              error={!!(isRegister ? registerErrors.username : loginErrors.username)}
              helperText={isRegister ? registerErrors.username : loginErrors.username}
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value, isRegister)}
              error={!!(isRegister ? registerErrors.password : loginErrors.password)}
              helperText={isRegister ? registerErrors.password : loginErrors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </IconButton>
                ),
              }}
            />
            {isRegister && (
              <TextField
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value, true)}
                error={!!registerErrors.confirmPassword}
                helperText={registerErrors.confirmPassword}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  ),
                }}
              />
            )}
            <Button variant="contained" onClick={isRegister ? handleRegister : handleLogin} fullWidth>
              {isRegister ? "Sign Up" : "Login"}
            </Button>
            <Button
              color="secondary"
              size="small"
              onClick={() => setIsRegister(!isRegister)}
              sx={{ textTransform: "none" }}
            >
              {isRegister ? "Login here" : "Sign up"}
            </Button>
          </Stack>
        </Paper>
      </Box>
    ) : (
      // -------- DASHBOARD --------
      <Box sx={{ bgcolor: "#f9fafc", minHeight: "100vh", py: 4 }}>
        <Box width={{ xs: "95%", sm: "90%", md: "70%" }} mx="auto" display="flex" flexDirection="column" gap={3}>
          
          {/* HEADER */}
          <Typography variant="h4" fontWeight="700" textAlign="center" color="primary">
            Device Management System
          </Typography>

{/* USER & NOTIFICATIONS */}
<Box display="flex" justifyContent="space-between" alignItems="center" position="relative">
  <Stack direction="row" spacing={2} alignItems="center">
    <Typography fontWeight="600">{username}</Typography>
    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
      <Avatar sx={{ bgcolor: stringToColor(username), color: "white" }}>
        {username[0]?.toUpperCase()}
      </Avatar>
    </IconButton>
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
      <MenuItem disabled>{username}</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  </Stack>
  
  {/* Bell Icon */}
  <Box position="relative">
    <IconButton onClick={handleDrawerOpen}>
      <Badge badgeContent={unreadCount} color="error">
        <FaBell />
      </Badge>
    </IconButton>

    {/* NOTIFICATION PANEL - Must be inside parent Box */}
    {drawerOpen && (
      <ClickAwayListener onClickAway={() => setDrawerOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50px",
            right: "0px",
            width: 350,
            bgcolor: "white",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            borderRadius: 3,
            overflow: "hidden",
            zIndex: 2000,
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2,
              py: 1.5,
              bgcolor: "#1976d2",
              color: "white",
            }}
          >
            <Typography fontWeight="bold">Notifications</Typography>
            <Button
              size="small"
              sx={{ color: "white", textTransform: "none" }}
              onClick={clearAll}
            >
              Clear All
            </Button>
          </Box>

          {/* CONTENT */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {notifications.length === 0 ? (
              <Typography align="center" sx={{ color: "gray", fontStyle: "italic", mt: 2 }}>
                No notifications yet
              </Typography>
            ) : (
              notifications.map((n) => (
                <Paper
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: n.isRead ? "#f8f9fa" : "#e3f2fd",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {n.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                  >
                    {new Date(n.createdAt).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
})}

                  </Typography>
                </Paper>
              ))
            )}
          </Box>

          {/* FOOTER */}
          <Box
            sx={{
              borderTop: "1px solid #eee",
              p: 1.5,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button variant="outlined" size="small" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </ClickAwayListener>
    )}
  </Box>
</Box>

          {/* VIEW SWITCHER (Admin Only) */}
          {role === "Admin" && (
            <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
              <Button
                variant={currentPageView === "active" ? "contained" : "outlined"}
                startIcon={<FaLayerGroup />}
                onClick={() => setCurrentPageView("active")}
              >
                Active Devices
              </Button>
              <Button
                variant={currentPageView === "deleted" ? "contained" : "outlined"}
                startIcon={<FaTrash />}
                color="error"
                onClick={() => setCurrentPageView("deleted")}
              >
                Deleted Devices
              </Button>
            </Box>
          )}

          {/* SEARCH */}
          <Box mb={2} display="flex" gap={2} flexWrap="wrap">
            <TextField
              label={
                role === "Admin"
                  ? `Search by ${searchField === "deviceName" ? "Device Name" : searchField === "description" ? "Description" : "Username"}`
                  : "Search Devices"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
            {role === "Admin" && (
              <TextField
                select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="deviceName">Device Name</option>
                <option value="description">Description</option>
                <option value="createdBy">Username</option>
              </TextField>
            )}
          </Box>

          {/* ADD DEVICE BUTTON */}
<Box display="flex" justifyContent="flex-end" mb={2}>
  <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
    Add Device
  </Button>
</Box>


          {/* DEVICE LIST */}
          <Stack spacing={2}>
            {(currentPageView === "active" ? paginatedDevices : deletedDevices).map(d => (
              <Paper
                key={d.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: d.isDeleted ? "#ffecec" : `linear-gradient(135deg, ${stringToColor(d.deviceName)}20, ${stringToColor(d.deviceName)}50)`,
                  boxShadow: 4
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight="700">{d.deviceName}</Typography>
                  <Typography variant="body2" color="text.secondary">{d.description}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {!d.isDeleted && <IconButton onClick={() => openEditDialog(d)} color="primary"><FaEdit /></IconButton>}
                  {!d.isDeleted && userRole === "Admin" && <IconButton onClick={() => handleDelete(d.id)} color="error"><FaTrash /></IconButton>}
                  {d.isDeleted && <Button variant="contained" size="small" color="secondary" onClick={() => handleUndoDelete(d.id)}>
                    Restore <FaUndo style={{ marginLeft: 5 }} />
                  </Button>}
                </Stack>
              </Paper>
            ))}
            {(currentPageView === "deleted" && deletedDevices.length === 0) && (
              <Typography>No deleted devices found.</Typography>
            )}
          </Stack>

          {/* PAGINATION (Active Devices only) */}
          {currentPageView === "active" && totalPages > 1 && (
            <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
              <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</Button>
              <Typography alignSelf="center">Page {currentPage} of {totalPages}</Typography>
              <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
            </Stack>
          )}

         {/* ADD DEVICE DIALOG */}
          <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Add Device</DialogTitle>
            <DialogContent>
              <TextField
                label="Device Name"
                fullWidth
                value={newDevice}
                onChange={(e) => {
                  setNewDevice(e.target.value);
                  setAddError(validateName(e.target.value));
                }}
                error={!!addError}
                helperText={addError}
                autoFocus
                margin="dense"
              />
              <TextField
                label="Description"
                fullWidth
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                margin="dense"
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setAddDialogOpen(false);
                  setNewDevice("");
                  setNewDescription("");
                  setAddError("");
                }}
              >
                Cancel
              </Button>
              <Button variant="contained" onClick={handleAdd} disabled={!!addError || !newDevice.trim()}>
                Add
              </Button>
            </DialogActions>
          </Dialog>


<Box display="flex" gap={2} mb={2}>
  <Button 
    variant="contained" 
    color="primary"
    onClick={() => triggerAverageCalculation("Temperature")} // Example column
  >
    Calculate Average Temperature
  </Button>
</Box>

          
 
          {/* EDIT DEVICE DIALOG */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Edit Device</DialogTitle>
            <DialogContent>
              <TextField
                label="Device Name"
                fullWidth
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setEditError(validateName(e.target.value, editId));
                }}
                error={!!editError}
                helperText={editError}
                autoFocus
                margin="dense"
              />
              <TextField
                label="Description"
                fullWidth
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                margin="dense"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdate} disabled={!!editError || !editName.trim()}>
                Update
              </Button>
            </DialogActions>
          </Dialog>

          {/* DELETE CONFIRM DIALOG */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the device "{deviceToDelete?.deviceName}"?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>No</Button>
              <Button onClick={confirmDelete} color="error">
                Yes
              </Button>
            </DialogActions>
          </Dialog>


          {/* UNDO SNACKBAR */}
         <Snackbar
  open={snackbarOpen}
  autoHideDuration={5000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <MuiAlert
    severity="info"
    sx={{ display: "flex", alignItems: "center" }}
    action={
      <Button
        color="inherit"
        size="small"
        onClick={() => handleUndoDelete(deletedDevice?.id)}
      >
        UNDO
      </Button>
    }
  >
    Device deleted
  </MuiAlert>
</Snackbar>

        </Box>
     </Box>
    )}
  </>
);
    }

    export default App;

