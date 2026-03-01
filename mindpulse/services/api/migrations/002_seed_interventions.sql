-- Migration: 002_seed_interventions.sql
-- Description: Seed initial interventions

INSERT INTO interventions (type, title, description, duration_seconds, content) VALUES
-- Breathing Exercises
('breathing', '4-7-8 Breathing Exercise', 'A calming breathing technique to reduce stress and anxiety', 180, '{
  "steps": [
    "Inhale through your nose for a count of 4",
    "Hold your breath for a count of 7",
    "Exhale through your mouth for a count of 8",
    "Repeat 4 times"
  ],
  "benefits": ["Reduces anxiety", "Lowers heart rate", "Calms nervous system"]
}'),
('breathing', 'Box Breathing', 'Equal-part breathing to achieve calm and focus', 240, '{
  "steps": [
    "Inhale for a count of 4",
    "Hold for a count of 4",
    "Exhale for a count of 4",
    "Hold for a count of 4",
    "Repeat 5 times"
  ],
  "benefits": ["Improves focus", "Reduces stress", "Balances emotions"]
}'),

-- Cognitive Reframes
('reframe', 'Thought Record', 'Challenge negative thoughts with evidence-based thinking', 300, '{
  "steps": [
    "Identify the triggering situation",
    "Notice the negative automatic thought",
    "Identify evidence for and against the thought",
    "Generate a more balanced thought",
    "Rate belief in the new thought"
  ],
  "benefits": ["Reduces worry", "Builds resilience", "Improves mood"]
}'),
('reframe', 'Gratitude Practice', 'Shift focus to positive aspects of your life', 240, '{
  "prompt": "Think of 3 things you are grateful for today, big or small",
  "benefits": ["Increases happiness", "Reduces rumination", "Improves perspective"]
}'),

-- Movement
('walk', '10-Minute Walk', 'Move your body to release tension', 600, '{
  "instructions": "Take a walk around your office, building, or outside. Focus on your surroundings.",
  "benefits": ["Reduces physical tension", "Clears mind", "Improves circulation"]
}'),
('walk', 'Desk Stretches', 'Simple stretches you can do at your desk', 300, '{
  "stretches": ["Neck rolls", "Shoulder shrugs", "Wrist circles", "Seated spinal twist", "Forward fold"],
  "benefits": ["Relieves tension", "Improves posture", "Increases energy"]
}'),

-- Pause/Mindfulness
('pause', '5-Minute Meditation', 'A brief mindfulness meditation', 300, '{
  "type": "guided_meditation",
  "instructions": "Find a quiet place, close your eyes, and focus on your breath",
  "benefits": ["Reduces stress", "Improves focus", "Increases awareness"]
}'),
('pause', 'Mindful Observation', 'Practice deep observation of your surroundings', 180, '{
  "instructions": "Pick an object near you. Spend 3 minutes observing every detail - colors, textures, shapes",
  "benefits": ["Grounds you in present moment", "Reduces anxiety", "Improves attention"]
}'),

-- Journaling
('journal', 'Stress Dump Journal', 'Write freely about what is stressing you', 600, '{
  "prompt": "What is on your mind right now? Write without judgment or censoring yourself",
  "benefits": ["Clarifies thoughts", "Reduces mental burden", "Improves processing"]
}'),
('journal', 'Three Good Things', 'Write down three positive things from today', 300, '{
  "prompt": "What were three good things (big or small) that happened today?",
  "benefits": ["Improves mood", "Builds resilience", "Shifts focus to positives"]
}');
