import { User, TRACK_KEYS, NOTIF_KEYS } from "../models/User.js";
import { Team } from "../models/Team.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { PLAN_KEYS, SUBSCRIPTION_STATUS } from "../config/billing.js";

function normalizeStandalonePlan(user) {
  return user.subscriptionStatus &&
    [
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.TRIALING,
      SUBSCRIPTION_STATUS.PAST_DUE,
    ].includes(user.subscriptionStatus)
    ? PLAN_KEYS.PRO
    : PLAN_KEYS.FREE;
}

function getMemberRecord(team, userId) {
  return (team?.members ?? []).find(
    (member) => String(member.user) === String(userId),
  );
}

function countActiveMembers(team) {
  return (team?.members ?? []).filter((member) => member.status === "active")
    .length;
}

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

export async function deleteAccount(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.activeTeam) {
      const team = await Team.findById(user.activeTeam);
      if (team) {
        const member = getMemberRecord(team, user._id);
        const activeMembers = countActiveMembers(team);

        if (member?.role === "owner") {
          if (activeMembers > 1) {
            return res.status(409).json({
              error:
                "Transfer team ownership or remove the remaining active members before deleting an owner account.",
            });
          }

          await Team.deleteOne({ _id: team._id });
        } else if (member && member.status === "active") {
          member.status = "removed";
          await team.save();
        }
      }
    }

    await InterviewSession.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({
      message: "Account deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}
