import type { ExerciseEquipment, ExerciseDifficulty, ExerciseMovementPattern, ExerciseMuscle } from './exercise.js';

export type SeedExercise = {
  name: string; slug: string; description: string; instructions: string[];
  primary_muscle: ExerciseMuscle; secondary_muscles: ExerciseMuscle[];
  equipment: ExerciseEquipment; difficulty: ExerciseDifficulty;
  movement_pattern: ExerciseMovementPattern; image_url: string | null;
  video_url: string | null; safety_notes: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

export const seedExercises: readonly SeedExercise[] = [
  {
    "name": "Push-Up",
    "slug": "push-up",
    "description": "A horizontal pressing movement using bodyweight.",
    "instructions": [
      "Place hands just outside shoulder width and brace your body in a straight line.",
      "Lower your chest with control, then press the floor away."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep ribs and hips aligned; stop if shoulder pain develops.",
    "status": "PUBLISHED"
  },
  {
    "name": "Bodyweight Squat",
    "slug": "bodyweight-squat",
    "description": "A foundational squat for leg strength and mobility.",
    "instructions": [
      "Stand with feet about shoulder width and brace your trunk.",
      "Sit down between your hips, then drive through the whole foot to stand."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep knees tracking over toes and use a comfortable depth.",
    "status": "PUBLISHED"
  },
  {
    "name": "Reverse Lunge",
    "slug": "reverse-lunge",
    "description": "A controlled single-leg lower-body exercise.",
    "instructions": [
      "Step one foot back and keep your torso tall.",
      "Lower until both knees are comfortable, then push through the front foot."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "quadriceps",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "lunge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a stable support if balance is limited.",
    "status": "PUBLISHED"
  },
  {
    "name": "Glute Bridge",
    "slug": "glute-bridge",
    "description": "A floor-based hip extension exercise.",
    "instructions": [
      "Lie on your back with knees bent and feet planted.",
      "Squeeze your glutes to lift your hips, pause, and lower slowly."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "hamstrings",
      "abdominals"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Avoid arching the lower back to gain height.",
    "status": "PUBLISHED"
  },
  {
    "name": "Pike Push-Up",
    "slug": "pike-push-up",
    "description": "A bodyweight press emphasizing the shoulders.",
    "instructions": [
      "Start in an inverted V with hands planted under shoulders.",
      "Bend elbows to lower your head toward the floor, then press up."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "triceps",
      "chest"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a reduced range if overhead shoulder motion is uncomfortable.",
    "status": "PUBLISHED"
  },
  {
    "name": "Chin-Up",
    "slug": "chin-up",
    "description": "An underhand vertical pull using bodyweight.",
    "instructions": [
      "Grip the bar with palms facing you and brace your legs.",
      "Pull your chest toward the bar, then lower under control."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Do not swing or drop suddenly from the bar.",
    "status": "PUBLISHED"
  },
  {
    "name": "Pull-Up",
    "slug": "pull-up",
    "description": "An overhand vertical pull for the upper back.",
    "instructions": [
      "Hang with an overhand grip and packed shoulders.",
      "Pull until your chin clears the bar, then lower with control."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use assistance rather than kipping if reps are not controlled.",
    "status": "PUBLISHED"
  },
  {
    "name": "Mountain Climber",
    "slug": "mountain-climber",
    "description": "A dynamic plank drill for the trunk and hips.",
    "instructions": [
      "Set up in a strong high plank with shoulders over hands.",
      "Drive one knee toward the chest at a time while keeping hips steady."
    ],
    "primary_muscle": "abdominals",
    "secondary_muscles": [
      "shoulders",
      "quadriceps"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "locomotion",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Slow the pace if your lower back begins to sag.",
    "status": "PUBLISHED"
  },
  {
    "name": "Single-Leg Calf Raise",
    "slug": "single-leg-calf-raise",
    "description": "A standing calf raise with unilateral loading.",
    "instructions": [
      "Balance on one foot with the other leg relaxed.",
      "Rise onto the ball of the foot, pause, and lower through a full range."
    ],
    "primary_muscle": "calves",
    "secondary_muscles": [
      "forearms"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Hold a wall for balance and avoid bouncing.",
    "status": "PUBLISHED"
  },
  {
    "name": "Hollow Body Hold",
    "slug": "hollow-body-hold",
    "description": "An isometric exercise for anterior core control.",
    "instructions": [
      "Lie on your back and press the lower back gently into the floor.",
      "Lift shoulders and legs as tolerated and hold without losing contact."
    ],
    "primary_muscle": "abdominals",
    "secondary_muscles": [
      "shoulders",
      "quadriceps"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Bend knees or shorten the hold if the back lifts.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Bench Press",
    "slug": "dumbbell-bench-press",
    "description": "A dumbbell horizontal press for chest development.",
    "instructions": [
      "Set the dumbbells at chest level with feet planted.",
      "Press up without clashing the weights, then lower until elbows are comfortable."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a spotter or lighter weights when training near failure.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Row",
    "slug": "dumbbell-row",
    "description": "A supported or hinged pull for the back.",
    "instructions": [
      "Brace one hand on a bench or hinge with a flat back.",
      "Pull the dumbbell toward the hip, then lower without twisting."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the neck neutral and avoid rotating the torso.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Shoulder Press",
    "slug": "dumbbell-shoulder-press",
    "description": "A vertical press for the shoulders.",
    "instructions": [
      "Start with dumbbells at shoulder height and brace your trunk.",
      "Press overhead along a comfortable path, then lower slowly."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "triceps",
      "abdominals"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Do not force a range that pinches the shoulder.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Goblet Squat",
    "slug": "dumbbell-goblet-squat",
    "description": "A front-loaded squat that teaches an upright position.",
    "instructions": [
      "Hold one dumbbell at the chest and stand tall.",
      "Squat between the hips while keeping the weight close, then stand."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "abdominals"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Choose a load that allows a stable, pain-free depth.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Romanian Deadlift",
    "slug": "dumbbell-romanian-deadlift",
    "description": "A hip hinge emphasizing the hamstrings.",
    "instructions": [
      "Hold dumbbells at your sides and soften the knees.",
      "Push hips back while keeping the weights close, then squeeze glutes to stand."
    ],
    "primary_muscle": "hamstrings",
    "secondary_muscles": [
      "glutes",
      "back"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Stop the descent when the back can no longer stay neutral.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Lateral Raise",
    "slug": "dumbbell-lateral-raise",
    "description": "An isolation exercise for the side deltoids.",
    "instructions": [
      "Stand tall with light dumbbells at your sides.",
      "Raise arms to about shoulder height with soft elbows, then lower slowly."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "trapezius"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use light weight and avoid shrugging or swinging.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Curl",
    "slug": "dumbbell-curl",
    "description": "A simple elbow flexion exercise for the biceps.",
    "instructions": [
      "Stand with elbows close to your sides.",
      "Curl the weights without leaning back, squeeze, and lower fully."
    ],
    "primary_muscle": "biceps",
    "secondary_muscles": [
      "forearms"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the movement controlled instead of using momentum.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Skull Crusher",
    "slug": "dumbbell-skull-crusher",
    "description": "A lying triceps extension with dumbbells.",
    "instructions": [
      "Lie on a bench with weights above the chest and elbows pointing up.",
      "Bend elbows to lower the weights beside the head, then extend."
    ],
    "primary_muscle": "triceps",
    "secondary_muscles": [
      "chest",
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "intermediate",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a manageable load and keep elbows from flaring widely.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Bulgarian Split Squat",
    "slug": "dumbbell-bulgarian-split-squat",
    "description": "A rear-foot-elevated unilateral squat.",
    "instructions": [
      "Place the rear foot on a low bench and find a stable stance.",
      "Lower the front knee with control, then drive through the front foot."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "dumbbell",
    "difficulty": "intermediate",
    "movement_pattern": "lunge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Start unweighted until balance and knee tracking are consistent.",
    "status": "PUBLISHED"
  },
  {
    "name": "Dumbbell Farmer Carry",
    "slug": "dumbbell-farmer-carry",
    "description": "A loaded carry for grip and full-body bracing.",
    "instructions": [
      "Hold heavy dumbbells at your sides with shoulders level.",
      "Walk with short controlled steps while keeping the ribs stacked over hips."
    ],
    "primary_muscle": "forearms",
    "secondary_muscles": [
      "abdominals",
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "movement_pattern": "carry",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a clear walking path and stop before posture breaks.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Back Squat",
    "slug": "barbell-back-squat",
    "description": "A barbell squat for whole-leg strength.",
    "instructions": [
      "Set the bar securely across the upper back and brace before unracking.",
      "Squat under control, then drive up while keeping the bar balanced over mid-foot."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "hamstrings",
      "abdominals"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use safety pins and a rack set at the correct height.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "description": "A barbell horizontal press for chest strength.",
    "instructions": [
      "Set eyes under the bar, plant feet, and retract the shoulder blades.",
      "Lower the bar to the lower chest with control and press while maintaining contact."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Always use safeties or a competent spotter for heavy sets.",
    "status": "PUBLISHED"
  },
  {
    "name": "Conventional Deadlift",
    "slug": "conventional-deadlift",
    "description": "A floor-to-stand barbell hip hinge.",
    "instructions": [
      "Stand with the bar over mid-foot, hinge down, and grip outside the legs.",
      "Brace, push the floor away, and lock out by standing tall without leaning back."
    ],
    "primary_muscle": "hamstrings",
    "secondary_muscles": [
      "glutes",
      "back",
      "forearms"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the bar close and stop if you cannot maintain a neutral spine.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Overhead Press",
    "slug": "barbell-overhead-press",
    "description": "A strict standing press for shoulders.",
    "instructions": [
      "Hold the bar at the upper chest and brace your glutes and trunk.",
      "Press overhead while moving the head naturally around the bar, then lower."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "triceps",
      "abdominals"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Do not use excessive back lean to complete a repetition.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Hip Thrust",
    "slug": "barbell-hip-thrust",
    "description": "A supported hip extension for glutes.",
    "instructions": [
      "Rest the upper back on a bench and position a padded bar over the hips.",
      "Drive through the feet to lift the hips, pause at the top, and lower."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "hamstrings",
      "abdominals"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Pad the bar and keep the chin slightly tucked.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Front Squat",
    "slug": "barbell-front-squat",
    "description": "A front-loaded squat emphasizing the quads.",
    "instructions": [
      "Rest the bar on the front shoulders with elbows high.",
      "Sit between the hips while keeping the chest tall, then stand through mid-foot."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "abdominals"
    ],
    "equipment": "barbell",
    "difficulty": "advanced",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a rack and reduce load if the wrist or shoulder position is painful.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Bent-Over Row",
    "slug": "barbell-bent-over-row",
    "description": "A hinged barbell row for the back.",
    "instructions": [
      "Hinge with a flat back and hold the bar just outside the legs.",
      "Pull toward the lower ribs, pause, and lower without changing the torso angle."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms",
      "hamstrings"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the load controlled and avoid jerking from the lower back.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Reverse Lunge",
    "slug": "barbell-reverse-lunge",
    "description": "A loaded reverse lunge for unilateral leg strength.",
    "instructions": [
      "Place a stable bar across the upper back and brace.",
      "Step back, lower smoothly, and push through the front foot to return."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "quadriceps",
      "hamstrings"
    ],
    "equipment": "barbell",
    "difficulty": "advanced",
    "movement_pattern": "lunge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a rack and clear space; begin with bodyweight if balance is new.",
    "status": "PUBLISHED"
  },
  {
    "name": "Barbell Good Morning",
    "slug": "barbell-good-morning",
    "description": "A controlled barbell hinge for the posterior chain.",
    "instructions": [
      "Set a light bar across the upper back and unlock the knees.",
      "Push the hips back until the trunk is near parallel, then extend the hips."
    ],
    "primary_muscle": "hamstrings",
    "secondary_muscles": [
      "glutes",
      "back"
    ],
    "equipment": "barbell",
    "difficulty": "advanced",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep this light and stop before the spine rounds.",
    "status": "PUBLISHED"
  },
  {
    "name": "Leg Press",
    "slug": "leg-press",
    "description": "A machine squat pattern for the lower body.",
    "instructions": [
      "Set the seat so knees and hips start in a comfortable range.",
      "Lower the platform with control and press through the feet without locking hard."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep hips and lower back against the pad throughout.",
    "status": "PUBLISHED"
  },
  {
    "name": "Seated Leg Curl",
    "slug": "seated-leg-curl",
    "description": "A machine isolation exercise for hamstrings.",
    "instructions": [
      "Align the knee joint with the machine pivot and secure the pads.",
      "Curl the pad down smoothly, pause, and return without letting it slam."
    ],
    "primary_muscle": "hamstrings",
    "secondary_muscles": [
      "calves"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Adjust the machine so the knee is not forced beyond its comfort range.",
    "status": "PUBLISHED"
  },
  {
    "name": "Leg Extension",
    "slug": "leg-extension",
    "description": "A machine isolation exercise for quadriceps.",
    "instructions": [
      "Align the knee with the pivot and place the ankle pad above the foot.",
      "Extend the knees under control, pause briefly, and lower slowly."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a moderate range and stop if the knee feels sharp pain.",
    "status": "PUBLISHED"
  },
  {
    "name": "Chest Press Machine",
    "slug": "chest-press-machine",
    "description": "A supported horizontal press.",
    "instructions": [
      "Set the handles level with mid-chest and keep feet planted.",
      "Press forward without shrugging, then return until the shoulders remain comfortable."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Do not let the shoulders roll forward at the end range.",
    "status": "PUBLISHED"
  },
  {
    "name": "Lat Pulldown Machine",
    "slug": "lat-pulldown-machine",
    "description": "A supported vertical pull for the lats.",
    "instructions": [
      "Grip the bar wider than shoulder width and brace under the pad.",
      "Pull toward the upper chest, then extend the arms with control."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Avoid pulling behind the neck or swinging the torso.",
    "status": "PUBLISHED"
  },
  {
    "name": "Seated Shoulder Press Machine",
    "slug": "seated-shoulder-press-machine",
    "description": "A guided overhead press.",
    "instructions": [
      "Adjust the seat so handles begin around ear height.",
      "Press upward smoothly and return without dropping the weight."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "triceps"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Choose a range that does not pinch the shoulder.",
    "status": "PUBLISHED"
  },
  {
    "name": "Calf Raise Machine",
    "slug": "calf-raise-machine",
    "description": "A loaded calf raise with machine support.",
    "instructions": [
      "Place the balls of the feet on the platform and set the pads securely.",
      "Lower the heels under control, then rise as high as comfortable."
    ],
    "primary_muscle": "calves",
    "secondary_muscles": [],
    "equipment": "machine",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use the safety lock and avoid bouncing at the bottom.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Chest Fly",
    "slug": "cable-chest-fly",
    "description": "A standing cable fly for the chest.",
    "instructions": [
      "Set handles around chest height and take a balanced stance.",
      "Bring the handles together with soft elbows, then open under control."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "shoulders"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the load light enough to control the shoulder position.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Row",
    "slug": "cable-row",
    "description": "A seated horizontal cable pull.",
    "instructions": [
      "Sit tall with a neutral spine and hold the handle.",
      "Pull toward the lower ribs, squeeze the back, and reach forward slowly."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Do not round or rock the torso to move the weight.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Triceps Pressdown",
    "slug": "cable-triceps-pressdown",
    "description": "A cable isolation exercise for triceps.",
    "instructions": [
      "Stand tall with elbows close to your sides.",
      "Press the handle down until the elbows extend, then return with control."
    ],
    "primary_muscle": "triceps",
    "secondary_muscles": [
      "shoulders"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep shoulders relaxed and avoid leaning heavily over the cable.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Biceps Curl",
    "slug": "cable-biceps-curl",
    "description": "A constant-tension curl.",
    "instructions": [
      "Face the cable with elbows close to the ribs.",
      "Curl the handle without moving the upper arms, then lower fully."
    ],
    "primary_muscle": "biceps",
    "secondary_muscles": [
      "forearms"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a stable stance and avoid swinging the load.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Lateral Raise",
    "slug": "cable-lateral-raise",
    "description": "A cable raise for the side deltoid.",
    "instructions": [
      "Stand side-on to a low cable and hold the handle with the far hand.",
      "Raise the arm to shoulder height, then lower slowly."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "trapezius"
    ],
    "equipment": "cable",
    "difficulty": "intermediate",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use light resistance and stop below any painful range.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Pull-Through",
    "slug": "cable-pull-through",
    "description": "A cable hinge emphasizing the glutes.",
    "instructions": [
      "Face away from a low cable and hold the rope between the legs.",
      "Hinge back, then drive the hips forward and stand tall."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "hamstrings",
      "abdominals"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the spine neutral and let the hips, not the arms, move the load.",
    "status": "PUBLISHED"
  },
  {
    "name": "Cable Wood Chop",
    "slug": "cable-wood-chop",
    "description": "A rotational cable movement for the trunk.",
    "instructions": [
      "Set the cable high and stand side-on with feet stable.",
      "Rotate the handle across the body while keeping the hips controlled."
    ],
    "primary_muscle": "abdominals",
    "secondary_muscles": [
      "shoulders",
      "glutes"
    ],
    "equipment": "cable",
    "difficulty": "intermediate",
    "movement_pattern": "rotation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Rotate within a comfortable range and do not yank the cable.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Swing",
    "slug": "kettlebell-swing",
    "description": "A ballistic hinge driven by the hips.",
    "instructions": [
      "Set the kettlebell ahead, hike it back, and hinge with a neutral spine.",
      "Snap the hips forward to float the bell, then guide it back between the legs."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "hamstrings",
      "back",
      "forearms"
    ],
    "equipment": "kettlebell",
    "difficulty": "intermediate",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Learn the hinge first and keep the bell below shoulder height.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Goblet Squat",
    "slug": "kettlebell-goblet-squat",
    "description": "A front-loaded kettlebell squat.",
    "instructions": [
      "Hold the bell by its horns close to the chest.",
      "Squat between the hips and stand while keeping the torso braced."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "abdominals"
    ],
    "equipment": "kettlebell",
    "difficulty": "beginner",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the bell close and use a depth you can control.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Clean",
    "slug": "kettlebell-clean",
    "description": "A single-arm kettlebell lift to the rack position.",
    "instructions": [
      "Hike the bell back and drive with the hips, keeping the elbow close.",
      "Rotate the hand around the bell softly into the rack position."
    ],
    "primary_muscle": "full_body",
    "secondary_muscles": [
      "glutes",
      "shoulders",
      "forearms"
    ],
    "equipment": "kettlebell",
    "difficulty": "advanced",
    "movement_pattern": "hinge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Practice with a light bell to avoid banging the forearm.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Turkish Get-Up",
    "slug": "kettlebell-turkish-get-up",
    "description": "A slow floor-to-stand stability movement.",
    "instructions": [
      "Keep the bell locked overhead while moving from lying to standing in stages.",
      "Reverse each stage with control and keep the eyes on the bell."
    ],
    "primary_muscle": "full_body",
    "secondary_muscles": [
      "shoulders",
      "abdominals",
      "glutes"
    ],
    "equipment": "kettlebell",
    "difficulty": "advanced",
    "movement_pattern": "locomotion",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a light load and stop if shoulder stability is lost.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Suitcase Carry",
    "slug": "kettlebell-suitcase-carry",
    "description": "A unilateral carry for grip and trunk control.",
    "instructions": [
      "Hold one bell at your side and stand tall.",
      "Walk slowly without leaning toward or away from the weight."
    ],
    "primary_muscle": "abdominals",
    "secondary_muscles": [
      "forearms",
      "shoulders"
    ],
    "equipment": "kettlebell",
    "difficulty": "beginner",
    "movement_pattern": "carry",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the path clear and switch sides evenly.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Reverse Lunge",
    "slug": "kettlebell-reverse-lunge",
    "description": "A loaded reverse lunge using one or two bells.",
    "instructions": [
      "Hold the bell securely and step one foot back.",
      "Lower under control and drive through the front foot to return."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "quadriceps",
      "hamstrings"
    ],
    "equipment": "kettlebell",
    "difficulty": "intermediate",
    "movement_pattern": "lunge",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a support if the offset load challenges balance.",
    "status": "PUBLISHED"
  },
  {
    "name": "Kettlebell Windmill",
    "slug": "kettlebell-windmill",
    "description": "A lateral hinge with overhead stability.",
    "instructions": [
      "Hold the bell overhead and turn the feet slightly away.",
      "Push the hip out and hinge sideways while keeping the arm stacked."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "abdominals",
      "hamstrings"
    ],
    "equipment": "kettlebell",
    "difficulty": "advanced",
    "movement_pattern": "rotation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use minimal load and keep the spine long throughout.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Pull-Apart",
    "slug": "band-pull-apart",
    "description": "A band exercise for upper-back endurance.",
    "instructions": [
      "Hold the band at shoulder height with soft elbows.",
      "Pull the hands apart by squeezing the shoulder blades, then return slowly."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "shoulders",
      "forearms"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use light tension and avoid shrugging.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Row",
    "slug": "band-row",
    "description": "A horizontal pull with elastic resistance.",
    "instructions": [
      "Anchor the band securely and sit or stand tall.",
      "Pull the handles toward the ribs, then release under control."
    ],
    "primary_muscle": "back",
    "secondary_muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Inspect the band for damage before each session.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Chest Press",
    "slug": "band-chest-press",
    "description": "A standing elastic horizontal press.",
    "instructions": [
      "Anchor the band behind you and step into a stable stance.",
      "Press forward without locking the elbows, then return slowly."
    ],
    "primary_muscle": "chest",
    "secondary_muscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "push",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Anchor the band to a point that cannot move or cut the skin.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Squat",
    "slug": "band-squat",
    "description": "A squat using a loop band for resistance.",
    "instructions": [
      "Stand on the band and hold the ends at the shoulders.",
      "Squat with knees tracking over toes, then stand against the band tension."
    ],
    "primary_muscle": "quadriceps",
    "secondary_muscles": [
      "glutes",
      "shoulders"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "squat",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Use a band with enough length to keep tension comfortable.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Glute Kickback",
    "slug": "band-glute-kickback",
    "description": "A band isolation exercise for hip extension.",
    "instructions": [
      "Anchor the band low and attach it around one ankle.",
      "Extend the leg back without arching, squeeze the glute, and return."
    ],
    "primary_muscle": "glutes",
    "secondary_muscles": [
      "hamstrings"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Hold support and keep the pelvis square to the floor.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Face Pull",
    "slug": "band-face-pull",
    "description": "An upper-back and rear-shoulder pull.",
    "instructions": [
      "Anchor the band around face height and grip it with thumbs up.",
      "Pull toward the face while rotating the hands apart, then release."
    ],
    "primary_muscle": "shoulders",
    "secondary_muscles": [
      "back",
      "forearms"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "pull",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the anchor secure and use smooth tension.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Pallof Press",
    "slug": "band-pallof-press",
    "description": "An anti-rotation trunk press.",
    "instructions": [
      "Stand side-on to a secure anchor and hold the band at the chest.",
      "Press the hands forward without rotating, pause, and return."
    ],
    "primary_muscle": "abdominals",
    "secondary_muscles": [
      "shoulders",
      "glutes"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "rotation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Brace gently and keep feet planted rather than twisting.",
    "status": "PUBLISHED"
  },
  {
    "name": "Band Hamstring Curl",
    "slug": "band-hamstring-curl",
    "description": "A standing band curl for the hamstrings.",
    "instructions": [
      "Anchor a loop band low and secure it around one ankle while holding support.",
      "Bend the knee to draw the heel toward the glutes, then lower slowly."
    ],
    "primary_muscle": "hamstrings",
    "secondary_muscles": [
      "calves"
    ],
    "equipment": "band",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "Keep the pelvis steady and inspect the band before use.",
    "status": "PUBLISHED"
  },
  {
    "name": "ZZ Hidden Draft Test",
    "slug": "zz-hidden-draft-test",
    "description": "A seed verification row that must remain hidden.",
    "instructions": [
      "This row is intentionally not public.",
      "Use it only to verify the status policy."
    ],
    "primary_muscle": "full_body",
    "secondary_muscles": [],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "This verification row is not for training.",
    "status": "DRAFT"
  },
  {
    "name": "ZZ Hidden Archived Test",
    "slug": "zz-hidden-archived-test",
    "description": "An archived seed verification row.",
    "instructions": [
      "This row is intentionally not public.",
      "Use it only to verify the status policy."
    ],
    "primary_muscle": "full_body",
    "secondary_muscles": [],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "movement_pattern": "isolation",
    "image_url": null,
    "video_url": null,
    "safety_notes": "This verification row is not for training.",
    "status": "ARCHIVED"
  }
];
