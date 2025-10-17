# Focus Mode: UX Design Reasoning

## Overview

Focus Mode is a context-narrowing feature that helps users concentrate on specific subsets of vehicles by dimming irrelevant markers on the map. This document explains the UX thought process behind Focus Mode's design and implementation.

---

## Problem Statement

### The Challenge
Fleet monitoring applications often display dozens or hundreds of vehicles simultaneously on a map. Users frequently need to focus on specific subsets (e.g., vehicles with active events, vehicles within a geofence, vehicles on specific routes) but lose visual clarity when all markers compete for attention equally.

### User Pain Points
1. **Visual Overload**: Too many markers create cognitive load
2. **Context Switching**: Users must mentally filter irrelevant information
3. **Inefficient Workflows**: Finding relevant vehicles requires scanning all markers
4. **Decision Fatigue**: Equal visual weight makes prioritization difficult

---

## Design Philosophy

### Core Principle: Progressive Disclosure
Focus Mode follows the principle of **progressive disclosure** - showing users only what's relevant to their current task while keeping other information accessible but de-emphasized.

### Key UX Tenets

1. **Non-Destructive**: Focus Mode dims rather than hides irrelevant markers
   - **Why**: Users may need to reference dimmed vehicles for spatial context
   - **Benefit**: No information loss, just visual de-prioritization

2. **Immediate Visual Feedback**: Toggle state changes are instant
   - **Why**: Users need to understand cause-and-effect immediately
   - **Benefit**: Builds confidence in the tool's behavior

3. **Reversible Action**: One-click toggle to return to full view
   - **Why**: Users may need to quickly switch between focused and full context
   - **Benefit**: No fear of "losing" the previous state

4. **Transparent State**: Badge shows exactly what's being focused
   - **Why**: Users should never wonder "what am I looking at?"
   - **Benefit**: Reduces cognitive load and confusion

---

## Design Decisions

### 1. Toolbar Placement (Not Filter Modal)

**Decision**: Place Focus button in the map toolbar, separate from filters

**Reasoning**:
- **Spatial Proximity**: Focus Mode affects the map view directly, so the control should be spatially close to the map
- **Immediate Feedback**: Toolbar buttons provide instant visual state changes without modal dismissal delays
- **Complementary Function**: Focus Mode works *in conjunction* with filters (filter → then focus), not as a filtering criterion itself
- **Persistent Access**: Users may toggle focus frequently; toolbar access is faster than opening a modal

**Alternative Considered**: Placing inside filter modal
- **Rejected Because**: Would require modal open → toggle → close → see effect workflow, adding friction

---

### 2. Icon-Only Button (44×44px)

**Decision**: Use Crosshair icon without text label

**Reasoning**:
- **Visual Metaphor**: Crosshair represents "targeting" or "focusing" - universally understood
- **Spatial Efficiency**: Icon-only buttons minimize toolbar footprint, leaving more map space
- **Consistent Design**: Matches existing toolbar pattern (fullscreen, zoom buttons are icon-only)
- **Tooltips Compensate**: Hover tooltips provide full context without permanent space cost

**Icon Choice - Crosshair**:
- Represents precision and targeting
- Distinct from other toolbar icons (no visual confusion)
- Works well at small sizes (20px)
- Available in filled and outlined variants (perfect for active/inactive states)

---

### 3. Badge Positioning (Top-Right Corner)

**Decision**: Position count badge at `-8px, -8px` from button corner

**Reasoning**:
- **Notification Pattern**: Top-right badges are a universal UI pattern (email, messages, notifications)
- **Non-Intrusive**: Doesn't overlap the icon itself
- **Clearly Associated**: Visual proximity makes ownership obvious
- **Scan Priority**: Top-right position catches eye movement naturally (F-pattern reading)

**Badge Content - "X/Y" Format**:
- **Focused Count (X)**: Shows how many vehicles are being emphasized
- **Total Count (Y)**: Provides denominator for context
- **Example**: "45/150" = "You're focusing on 45 out of 150 vehicles"

---

### 4. Visual State System

**Decision**: Three visual states with distinct appearances

#### State 1: Inactive (Default)
```
Button: White background, gray border
Icon: Gray Crosshair (outlined)
Badge: Hidden
```
**Message**: "Focus Mode is available but not active"

#### State 2: Active
```
Button: Blue background (#1867ff)
Icon: White Crosshair (filled)
Badge: Green badge with count (e.g., "45/150")
```
**Message**: "Focus Mode is active - you're seeing X focused vehicles"

#### State 3: Disabled (No Vehicles to Focus)
```
Button: Grayed out, cursor: not-allowed
Badge: Hidden
Tooltip: Explains why disabled
```
**Message**: "Focus Mode can't be used right now (e.g., no vehicles with events)"

**Reasoning**:
- **Clear Affordance**: Each state is visually distinct
- **Instant Recognition**: User knows current state at a glance
- **No Ambiguity**: Can't accidentally activate when disabled

---

### 5. Dimming Effect (Not Hiding)

**Decision**: Apply `opacity: 0.2` + `grayscale(100%)` to non-focused vehicles

**Reasoning**:
- **Spatial Context Preserved**: Users can still see relative positions
- **Reversible**: Easy to understand what's being de-emphasized
- **Graceful Degradation**: If dimmed markers overlap, they don't completely disappear
- **Accessibility**: 20% opacity is visible enough for low-vision users to detect presence

**Rejected Alternatives**:
- **Hide Completely**: Removes spatial context, users lose bearings
- **Blur Effect**: Performance-intensive, less clear distinction
- **Lower z-index**: Doesn't provide enough visual distinction

---

### 6. Tooltip Design

**Decision**: Context-sensitive tooltip messages

**Inactive State Tooltip**:
```
"Mostrar solo vehículos con eventos (45 de 150)"
```
**Message**: Explains what will happen + provides count preview

**Active State Tooltip**:
```
"Mostrando 45 vehículos con eventos - Click para mostrar todos"
```
**Message**: Confirms current state + explains how to exit

**Reasoning**:
- **Educational**: First-time users understand the feature immediately
- **Reassuring**: Users know how to reverse the action before taking it
- **Informative**: Count preview helps users decide if focus is worthwhile

---

### 7. Badge Color Choice (Green #16a34a)

**Decision**: Use green for active focus badge (not blue)

**Reasoning**:
- **Semantic Meaning**: Green = "good", "active filter applied successfully"
- **Visual Hierarchy**: Distinguishes from blue button background
- **Contrast**: White text on green meets WCAG AA standards
- **Consistency**: Green often indicates active filtering in UI conventions

**Rejected Alternatives**:
- **Blue**: Would blend with button background
- **Red**: Implies error or warning
- **Yellow**: Implies caution, not confirmation

---

## Context-Aware Behavior

### Use Case 1: Eventos View
**Context**: User is viewing event markers
**Focus Mode Behavior**: Dims vehicles *without* events
**User Benefit**: Quickly identify which vehicles generated the visible events

### Use Case 2: Geofence Monitoring (Future)
**Context**: User selects a geofence
**Focus Mode Behavior**: Dims vehicles *outside* the geofence
**User Benefit**: Monitor compliance or proximity to zones

### Use Case 3: Route Tracking (Future)
**Context**: User selects a specific route
**Focus Mode Behavior**: Dims vehicles *not assigned* to that route
**User Benefit**: Monitor route progress without distractions

---

## Accessibility Considerations

### Visual Accessibility
- **Color Independence**: Focus Mode doesn't rely solely on color (uses opacity + grayscale)
- **High Contrast**: Active button has 4.5:1 contrast ratio minimum
- **Badge Legibility**: 11px font with 700 weight ensures readability

### Keyboard Accessibility
- **Tab Navigation**: Button is keyboard-focusable
- **Enter/Space Activation**: Standard button activation
- **Disabled State**: Button is unreachable when disabled (proper focus management)

### Screen Readers
- **Aria Labels**: Button has descriptive aria-label
- **State Announcement**: Badge count is announced when state changes
- **Tooltip Alternative**: Aria-describedby provides equivalent information

---

## Performance Considerations

### Smooth Transitions
```css
transition: opacity 0.3s ease, filter 0.3s ease
```
**Reasoning**:
- **300ms Duration**: Fast enough to feel responsive, slow enough to see the change
- **Ease Timing**: Natural acceleration/deceleration feels organic
- **GPU Acceleration**: Opacity and filter use hardware acceleration

### No Re-renders
**Implementation**: CSS-only dimming, no conditional rendering
**Benefit**: Hundreds of markers can be dimmed without performance impact

---

## Future Enhancements

### Potential Additions
1. **Focus Presets**: Save common focus configurations
2. **Multi-Focus**: Focus on multiple criteria simultaneously (e.g., events + geofence)
3. **Focus History**: Quick toggle between recent focus states
4. **Keyboard Shortcut**: Press `F` to toggle focus mode
5. **Analytics**: Track which focus modes are most valuable to users

### Expansion to Other Views
- **Unidades Tab**: Focus on vehicles by status (moving, stopped, no communication)
- **Registros Tab**: Focus on vehicles with recent stops/checkpoints
- **Dashboard**: Focus on vehicles by performance metrics

---

## Interaction Flow

### Activation Flow
```
1. User hovers over Focus button
   └─> Tooltip appears: "Mostrar solo vehículos con eventos (45 de 150)"

2. User clicks Focus button
   ├─> Button background changes to blue
   ├─> Icon changes to filled white Crosshair
   ├─> Badge appears: "45/150"
   └─> 105 vehicle markers dim (opacity: 0.2, grayscale: 100%)
       with 300ms transition

3. User sees focused context
   └─> 45 vehicles remain at full color/opacity
   └─> 105 vehicles are dimmed but visible
```

### Deactivation Flow
```
1. User hovers over active Focus button
   └─> Tooltip: "Mostrando 45 vehículos - Click para mostrar todos"

2. User clicks Focus button
   ├─> Button background returns to white
   ├─> Icon changes to outlined gray Crosshair
   ├─> Badge disappears
   └─> All 150 vehicles return to full opacity/color
       with 300ms transition

3. User sees full context restored
```

---

## Success Metrics

### Quantitative Metrics
- **Adoption Rate**: % of sessions where Focus Mode is used
- **Toggle Frequency**: Average number of focus toggles per session
- **Time to Event**: Does Focus Mode reduce time to find relevant vehicles?
- **Error Rate**: Does Focus Mode reduce misclicks on wrong vehicles?

### Qualitative Metrics
- **User Feedback**: Surveys asking if Focus Mode improves workflows
- **Confusion Rate**: Support tickets related to Focus Mode
- **Feature Discovery**: How many users discover Focus Mode organically?

---

## Conclusion

Focus Mode is designed as a **lightweight, non-destructive, spatially-aware** tool that reduces cognitive load without removing information. By placing it in the toolbar with clear visual states and smooth transitions, we create a feature that feels natural and becomes indispensable for users managing large fleets.

The design prioritizes:
- **Immediate feedback** over hidden complexity
- **Spatial proximity** over menu depth
- **Visual de-emphasis** over information removal
- **Reversibility** over permanence

This approach respects users' need for both focus and context, making Focus Mode a powerful tool that enhances rather than restricts their workflow.
