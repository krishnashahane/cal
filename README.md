# 🔥 Calorie Deficit Tracker

A simple real-time calorie tracking web app that helps you monitor your **calorie intake vs calorie burn** and stay on track with your **daily deficit goal**.

---

## 🚀 Features

- ⏱️ **Real-time calorie burn tracking**
- 🎯 **Daily deficit goal tracking (500 kcal/day)**
- ➕ Add calories (food intake)
- ➖ Subtract calories (exercise)
- 🔄 Reset tracking anytime
- 🎨 Visual feedback:
  - Green → Goal achieved
  - Red → Goal not met

---

## 🧠 How It Works

### 1. Passive Calorie Burn
- Assumes **2000 kcal/day burn**
- Automatically deducts calories over time:

2000 / 24 = ~83.33 kcal/hour


### 2. Deficit Goal
- Target: **500 kcal/day deficit**

500 / 24 = ~20.83 kcal/hour


### 3. Tracking Logic
- App continuously updates:
- `calorieCount` → your actual calorie balance
- `desiredDeficitCount` → expected deficit over time
- Compares both to determine if you're on track

---

## 🎮 Controls

| Button        | Action                      |
|--------------|----------------------------|
| Reset        | Resets all values          |
| -100 kcal    | Logs exercise (burns kcal) |
| +100 kcal    | Logs food intake           |

---

## 📊 Color Indicator

- 🟢 **Green** → You are ahead of your deficit goal  
- 🔴 **Red** → You are behind your goal  

---

## 🛠️ Tech Stack

- HTML
- CSS
- JavaScript (Vanilla)

---

## ⚙️ Customization

You can tweak values inside the script:

```js
const hourlyCalorieBurn = 2000 / 24.0;
const hourlyCalorieTargetDeficit = 500 / 24.0;
Change 2000 → your maintenance calories
Change 500 → your desired daily deficit
🧪 Run Locally

Copy the code into a file:

index.html

Open in browser:

double-click OR right-click → Open with browser

No dependencies. No setup. Instant run.

💡 Use Case

Perfect for:

Fat loss tracking
Discipline building
Understanding calorie deficit in real-time
⚠️ Note

This is a simplified tracker:

Does NOT account for metabolism variations
Does NOT track actual food/exercise precisely

Use it as a behavioral tool, not medical advice.
