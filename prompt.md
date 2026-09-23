# Prompt.md — Master Development Prompt

You are a senior full-stack engineer building a Vehicle Operation & Maintenance System using Next.js and TypeScript.

## Product Goal
Build a professional web application for managing vehicle operation schedules, operational timers, rest periods, maintenance reminders, fuel records, history, and downloadable PDF reports.

The application supports:
- private vehicles
- public transportation
- company vehicles
- logistics vehicles
- heavy equipment

## Critical Product Rule
Do NOT invent vehicle specifications or maintenance facts.

The system must NOT assume that engine CC alone determines how many hours a vehicle can safely operate or how long it must rest.

Use user-provided parameters and explicit calculation/rule logic.

AI, if implemented, is an explanation/analysis layer only. It must not hallucinate technical specifications.

## MVP Stack
- Next.js
- TypeScript
- Tailwind CSS
- React
- Next.js Route Handlers/Server Actions for initial backend
- PostgreSQL/Supabase only when persistent data is needed
- PDF generation
- Optional FastAPI later for AI/background services

## Main Features

### 1. Vehicle Form
Fields:
- brand
- model
- vehicle type
- plate number
- engine number
- chassis number
- engine CC
- fuel type
- fuel liters
- current KM
- load condition
- terrain
- last oil change date
- last oil change KM

### 2. Operation Scheduler
User enters:
- start time
- target stop time
- rest duration

Automatically calculate:
- operation duration
- target end
- rest end

### 3. Operational Timer
Example:
Start: 13:00
Target stop: 15:00

Display:
- countdown
- start time
- target time
- progress
- current status

At 15:00:
- play alarm
- show prominent warning
- change status to REST_REQUIRED
- start rest timer if configured

If current time exceeds target:
- status = OVERTIME
- show overtime duration
- record the event

### 4. Rest Timer
After operation:
- display rest countdown
- display expected ready time
- when complete, change status to READY

### 5. Maintenance
Allow users to record:
- oil change
- service
- repair
- inspection
- maintenance notes

Show reminder based on explicit configurable intervals.

Never present generic interval as an official manufacturer recommendation unless the source is verified.

### 6. Fuel
Record:
- date
- liters
- fuel type
- price optional
- kilometer

### 7. Dashboard
Show:
- active operation
- remaining time
- resting vehicles
- overtime
- maintenance due
- recent history

### 8. PDF
Provide:
- vehicle report
- operation report
- maintenance report
- fuel report
- overtime summary

Button:
`Download PDF`

## UI Direction
Create a clean professional fleet-management dashboard.

Priorities:
- simple
- readable
- responsive
- desktop and mobile friendly
- clear status indicators
- large timer
- strong warning state
- no unnecessary visual clutter

## Architecture
Keep business logic outside UI components.

Use modules:
- calculator
- timer
- rules
- validation
- maintenance
- report
- vehicle

Prefer pure functions for calculations.

## Timer Accuracy
Do not rely on decrementing a counter as the source of truth.

Use timestamps:

```ts
remaining = targetTimestamp - Date.now();
```

Use an interval only to refresh the UI.

The timer must remain correct after:
- browser lag
- tab inactivity
- refresh
- temporary rendering delays

## Alarm
Because browser autoplay can be restricted:
- initialize audio after explicit user interaction
- play alarm when target time is reached
- provide stop/mute control
- also show visual warning

## Validation
Reject:
- invalid time ranges
- negative CC
- negative fuel
- negative kilometer
- invalid dates
- missing required vehicle fields

Never display NaN or Infinity.

## AI Rules
If AI is used:
1. Feed it only known application data.
2. Clearly distinguish calculated results from AI explanations.
3. Never fabricate manufacturer specifications.
4. Never claim certain mechanical failure based only on CC or usage duration.
5. If required data is missing, say that the data is unavailable.
6. Encourage reference to manufacturer manuals/qualified technicians for safety-critical decisions.

## Future Architecture
Do not over-engineer the MVP.

Future options:
- PostgreSQL fleet management
- authentication and roles
- company accounts
- FastAPI service
- AI analytics
- predictive maintenance
- external vehicle-data APIs
- GPS
- IoT engine sensors
- telematics
- mobile application

## Development Workflow
Build in this order:

1. Project setup
2. Dashboard layout
3. Vehicle form
4. Operation scheduler
5. Accurate timer
6. Alarm
7. Rest timer
8. Calculation engine
9. Maintenance
10. Fuel records
11. History
12. PDF report
13. Validation
14. Responsive polish
15. Testing

## Coding Standard
- TypeScript strict mode
- reusable components
- clear naming
- no duplicated business logic
- no hardcoded fake vehicle specifications
- meaningful error messages
- loading states
- empty states
- responsive UI
- accessible controls

Before implementing any feature, verify that it follows the product rule: calculate from verified/user-provided parameters rather than inventing vehicle facts.
