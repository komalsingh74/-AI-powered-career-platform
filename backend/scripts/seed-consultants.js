import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/connectDB.js";
import Consultant from "../models/Consultant.js";

const demoConsultants = [
  {
    name: "Maya Chen",
    title: "Leadership & Career Strategy",
    email: "maya.chen@example.test",
    bio: "A practical thought partner for career pivots, leadership growth, and finding a role that fits your strengths.",
    specialties: ["Career transitions", "Leadership", "Negotiation"],
    timeZone: "Asia/Kolkata",
    slotDurationMinutes: 60,
    priceCents: 7500,
    currency: "inr",
    availability: [
      { dayOfWeek: 1, startTime: "10:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "10:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "10:00", endTime: "17:00" },
    ],
  },
  {
    name: "Jordan Rivera",
    title: "Resume & Interview Coach",
    email: "jordan.rivera@example.test",
    bio: "Helps people turn their experience into a clear story and feel prepared for the conversations that move careers forward.",
    specialties: ["Resume strategy", "Interview practice", "Job search"],
    timeZone: "Asia/Kolkata",
    slotDurationMinutes: 60,
    priceCents: 6500,
    currency: "inr",
    availability: [
      { dayOfWeek: 2, startTime: "10:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "10:00", endTime: "17:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "14:00" },
    ],
  },
];

async function seedConsultants() {
  await connectDB();
  for (const consultant of demoConsultants) {
    await Consultant.updateOne(
      { email: consultant.email },
      { $set: consultant },
      { upsert: true, runValidators: true }
    );
  }
  console.log(`Seeded ${demoConsultants.length} demo consultants.`);
}

seedConsultants()
  .catch((error) => {
    console.error("Unable to seed demo consultants:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
