import { User, TRACK_KEYS, NOTIF_KEYS } from "../models/User.js";

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const { name, role, target, tracks, notifications } = req.body;

    if (typeof name === "string" && name.trim()) user.name = name.trim();
    if (typeof role === "string") user.role = role.trim();
    if (typeof target === "string") user.target = target.trim();

    if (tracks && typeof tracks === "object") {
      for (const key of TRACK_KEYS) {
        if (key in tracks) user.tracks.set(key, !!tracks[key]);
      }
    }
    if (notifications && typeof notifications === "object") {
      for (const key of NOTIF_KEYS) {
        if (key in notifications) user.notifications.set(key, !!notifications[key]);
      }
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}
