# Timeline Granularity Implementation Plan

## Overview

This document outlines the implementation plan for adding granular timeline controls to the Sonic Graph visualization. The feature addresses visual clutter and audio crackling issues that occur when many notes or attachments are created within the same time period.

## Problem Statement

### Current Limitations
- **Year-only Timeline**: Timeline currently shows data organized by year markers only
- **Visual Clutter**: Multiple files created around the same time cause overlapping nodes and visual chaos
- **Audio Crackling**: Simultaneous note triggering from clustered creation dates causes audio distortion
- **No User Control**: Users cannot adjust timeline granularity to match their workflow patterns

### Impact
- Poor user experience when viewing graphs with clustered file creation dates
- Audio quality degradation during timeline animation
- Limited utility for users with intensive daily/weekly workflows

## Solution Architecture

### 1. Settings Extension

#### New Timeline Granularity Settings
```typescript
timeline: {
    // Existing settings
    duration: number;
    spacing: 'auto' | 'dense' | 'even' | 'custom';
    loop: boolean;
    showMarkers: boolean;
    
    // NEW: Timeline granularity controls
    granularity: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom';
    customRange: {
        value: number;
        unit: 'years' | 'months' | 'weeks' | 'days' | 'hours';
    };
    
    // NEW: Smart event spreading for clustered events
    eventSpreadingMode: 'none' | 'gentle' | 'aggressive';
    maxEventSpacing: number; // Maximum time window for spreading (seconds)
    
    // NEW: Audio crackling prevention
    simultaneousEventLimit: number; // Max concurrent audio events
    eventBatchSize: number; // Events to process per animation frame
}
```

#### Settings Location
- **Target**: Timeline Section in Sonic Graph Modal Settings Panel
- **Integration**: Extends existing `createTimelineSettings()` method
- **Persistence**: Per-session settings (not global plugin settings)

### 2. UI Controls Design

#### Timeline Granularity Section
```
┌─ Timeline Granularity ────────────────────────────────┐
│                                                       │
│  Time Range: [Year ▼]                                │
│                                                       │
│  Custom Range: [___] [Months ▼] (when Custom selected)│
│                                                       │
│  Event Spreading: ○ None ● Gentle ○ Aggressive       │
│                                                       │
│  Preview: [Timeline visualization showing distribution]│
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Control Elements
1. **Granularity Dropdown**: Year, Month, Week, Day, Hour, Custom
2. **Custom Range Controls**: Number input + unit selector (when Custom selected)
3. **Event Spreading Mode**: Radio buttons for clustering behavior
4. **Smart Preview**: Mini timeline showing how events will be distributed
5. **Audio Limits**: Advanced section with concurrent event limits

### 3. Core Implementation Components

#### 3.1 TemporalGraphAnimator Updates
**File**: `src/graph/TemporalGraphAnimator.ts`

**Changes Required**:
- Modify date range calculation to support different granularities
- Implement event spreading algorithms for clustered events
- Add audio queue management to prevent crackling

**Key Methods**:
```typescript
// NEW: Calculate date range based on granularity
private calculateDateRange(granularity: string, customRange?: CustomRange): {start: Date, end: Date}

// NEW: Spread clustered events across time window
private spreadClusteredEvents(events: TimelineEvent[], spreadingMode: string): TimelineEvent[]

// NEW: Manage audio event queue to prevent crackling
private scheduleAudioEvents(events: TimelineEvent[], simultaneousLimit: number): void
```

#### 3.2 Settings Panel Updates
**File**: `src/ui/SonicGraphModal.ts`

**Changes Required**:
- Extend `createTimelineSettings()` with new granularity controls
- Add event listeners for granularity changes
- Implement real-time preview updates

**Key Methods**:
```typescript
// NEW: Create timeline granularity controls
private createGranularityControls(container: HTMLElement): void

// NEW: Update timeline preview based on settings
private updateTimelinePreview(): void

// NEW: Handle granularity setting changes
private onGranularityChange(newGranularity: string): void
```

#### 3.3 Settings Interface Updates
**File**: `src/utils/constants.ts`

**Changes Required**:
- Extend `SonicGraphSettings.timeline` interface
- Add default values for new settings
- Update settings validation

## Implementation Phases

### Phase 1: Settings Infrastructure
**Timeline**: 1-2 days
**Priority**: High

1. **Extend Settings Interface**
   - Update `SonicGraphSettings` in `constants.ts`
   - Add new timeline granularity properties
   - Define default values

2. **Update Settings Panel UI**
   - Add granularity dropdown to Timeline section
   - Create custom range controls
   - Add event spreading mode selection

3. **Settings Persistence**
   - Ensure new settings are saved/loaded correctly
   - Add settings validation

### Phase 2: Timeline Engine Updates
**Timeline**: 2-3 days
**Priority**: High

1. **Date Range Calculation**
   - Modify `TemporalGraphAnimator` to support different granularities
   - Implement date range calculation for each granularity level
   - Add custom range support

2. **Event Spreading Logic**
   - Implement algorithms to spread clustered events
   - Add different spreading modes (none, gentle, aggressive)
   - Maintain chronological order while reducing clustering

3. **Timeline Marker Updates**
   - Update marker generation for different granularities
   - Add appropriate time labels (months, weeks, days, hours)
   - Ensure markers scale appropriately

### Phase 3: Audio Optimization
**Timeline**: 1-2 days
**Priority**: Medium

1. **Audio Queue Management**
   - Implement simultaneous event limiting
   - Add audio event batching
   - Prevent crackling through smart scheduling

2. **Performance Optimization**
   - Optimize animation frame rate based on granularity
   - Add adaptive performance scaling
   - Implement efficient event processing

### Phase 4: User Experience Enhancements
**Timeline**: 1 day
**Priority**: Low

1. **Timeline Preview**
   - Add mini timeline preview in settings
   - Show event distribution visually
   - Real-time updates as settings change

2. **Smart Defaults**
   - Auto-detect optimal granularity based on data
   - Provide recommended settings
   - Add preset configurations

## Technical Considerations

### Performance Impact
- **Memory Usage**: Different granularities may require more timeline events
- **Animation Performance**: Finer granularities may impact frame rates
- **Audio Processing**: Event spreading requires additional computation

### Backward Compatibility
- All existing timeline functionality remains unchanged
- Default settings maintain current behavior
- No breaking changes to existing APIs

### Testing Strategy
- **Unit Tests**: Test granularity calculations and event spreading
- **Integration Tests**: Test UI controls and settings persistence
- **Performance Tests**: Measure impact on animation performance
- **Audio Tests**: Verify crackling prevention works effectively

## User Experience Goals

### Primary Objectives
1. **Reduce Visual Clutter**: Users can choose appropriate time granularity
2. **Prevent Audio Crackling**: Smart event spreading eliminates simultaneous triggers
3. **Maintain Intuitive Controls**: Settings are easy to understand and use
4. **Provide Immediate Feedback**: Changes are visible immediately

### Success Metrics
- **User Adoption**: Users actively adjust granularity settings
- **Audio Quality**: Significant reduction in crackling reports
- **Performance**: No noticeable impact on animation smoothness
- **Usability**: Settings are discoverable and understandable

## Future Enhancements

### Potential Extensions
1. **Adaptive Granularity**: Automatically adjust based on data density
2. **Custom Time Ranges**: Allow users to specify exact date ranges
3. **Granularity Presets**: Save and load granularity configurations
4. **Advanced Spreading**: More sophisticated event distribution algorithms

### Integration Opportunities
1. **Smart Clustering**: Integrate with existing smart clustering algorithms
2. **Content-Aware Positioning**: Consider granularity in positioning logic
3. **Export Features**: Include granularity settings in timeline exports

## Conclusion

This implementation plan provides a comprehensive approach to adding timeline granularity controls to the Sonic Graph. The phased approach ensures core functionality is implemented first, with enhancements added incrementally. The solution addresses both visual clutter and audio crackling issues while maintaining the existing user experience.

The feature aligns with the plugin's architecture and follows established patterns for settings management and UI design. Implementation should take approximately 5-8 days of development time across the four phases.