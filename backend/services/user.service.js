import User from "../models/User.js";

export async function updateUserProfile(userId, input) {
  const allowedUpdates = {};

  if (input.name !== undefined) {
    allowedUpdates.name = input.name.trim();
  }

  if (input.phone !== undefined) {
    allowedUpdates.phone = input.phone.trim();
  }

  if (input.profile !== undefined) {
    allowedUpdates.profile = input.profile;
  }

  return User.findByIdAndUpdate(
    userId,
    { $set: allowedUpdates },
    {
      new: true,
      runValidators: true,
    }
  );
}