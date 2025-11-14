https://github.com/obsidianmd/obsidian-releases/pull/8036#issuecomment-3531232748

Thank you for your submission, an automated scan of your plugin code's revealed the following issues:
### Required

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/ClusterAudioMapper.ts#L415-L415) Async method 'executeTransitionEffect' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/ClusterAudioMapper.ts#L640-L640) Async method 'startClusterAudio' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/ClusterThemeGenerator.ts#L24-L24)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/CommunityEvolutionTracker.ts#L45-L45)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/CommunityThemeGenerator.ts#L31-L31)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/percussion/RhythmicPercussionEngine.ts#L50-L50)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/external/whale-integration.ts#L44-L44) Async method 'initialize' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/clustering/CommunityEvolutionTracker.ts#L423-L423) Async method 'triggerEvolutionAudioEvent' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/configs/InstrumentConfigLoader.ts#L104-L104)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L2839-L2839)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L3659-L3659)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4711-L4711)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4714-L4714)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4717-L4717)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4726-L4726)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4729-L4729)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4732-L4732)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4735-L4735)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4744-L4744)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4747-L4747)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L4750-L4750)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5040-L5040)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5075-L5075)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5086-L5086)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/freesound/FreesoundSampleManager.ts#L103-L103)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/freesound/SamplePreloader.ts#L296-L296)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/HarmonicLayerManager.ts#L479-L479)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ConnectionTypeMappingPanel.ts#L911-L911)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ContentAwareMapper.ts#L220-L220)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ContentAwareMapper.ts#L822-L822)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/DepthBasedMapper.ts#L647-L647)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/FileTypeAnalyzer.ts#L158-L158)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/FileTypeAnalyzer.ts#L701-L701)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/InstrumentDistributor.ts#L234-L234)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/InstrumentSelector.ts#L106-L106)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/InstrumentSelector.ts#L145-L145)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/InstrumentSelector.ts#L706-L706)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/MetadataMappingRules.ts#L181-L181)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/MetadataMappingRules.ts#L594-L594)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ObsidianMetadataMapper.ts#L188-L188)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ObsidianMetadataMapper.ts#L320-L320)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/ObsidianMetadataMapper.ts#L593-L593)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/TagSemanticMapper.ts#L103-L103)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/TagSemanticMapper.ts#L774-L774)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/TagSemanticMapper.ts#L804-L804)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/VaultMappingOptimizer.ts#L123-L123)[[39]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/optimizations/PlaybackOptimizer.ts#L122-L122)[[40]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/orchestration/HubCentralityAnalyzer.ts#L422-L422)[[41]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/orchestration/HubOrchestrationManager.ts#L75-L75)[[42]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/orchestration/HubOrchestrationManager.ts#L376-L376)[[43]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/orchestration/HubOrchestrationManager.ts#L407-L407)[[44]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/voice-management/VoiceManager.ts#L87-L87)[[45]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/voice-management/VoiceManager.ts#L385-L385)[[46]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L213-L213)[[47]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L214-L214)[[48]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L639-L639)[[49]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L679-L679)[[50]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L680-L680)[[51]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L681-L681)[[52]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L682-L682)[[53]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L683-L683)[[54]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L684-L684)[[55]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L685-L685)[[56]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L686-L686)[[57]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L687-L687)[[58]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L688-L688)[[59]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L689-L689)[[60]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L690-L690)[[61]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L691-L691)[[62]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L692-L692)[[63]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/ExportModal.ts#L693-L693)[[64]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/FileCollisionModal.ts#L112-L115)[[65]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/FileCollisionModal.ts#L125-L129)[[66]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/FileCollisionModal.ts#L170-L170)[[67]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/FileCollisionModal.ts#L221-L228)[[68]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/external/freesound/whale-audio-manager.ts#L385-L385)[[69]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/external/freesound/whale-audio-manager.ts#L395-L395)[[70]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/ContentAwarePositioning.ts#L221-L221)[[71]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L376-L376)[[72]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1010-L1010)[[73]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1041-L1041)[[74]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1492-L1492)[[75]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1498-L1498)[[76]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1507-L1507)[[77]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1918-L1918)[[78]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeExtractor.ts#L173-L173)[[79]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeExtractor.ts#L789-L789)[[80]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L118-L118)[[81]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L265-L265)[[82]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L426-L426)[[83]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L426-L426)[[84]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L760-L760)[[85]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/SmartClusteringAlgorithms.ts#L762-L762)[[86]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/TemporalGraphAnimator.ts#L197-L199)[[87]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/TemporalGraphAnimator.ts#L358-L358)[[88]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L187-L187)[[89]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L179-L179)[[90]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L220-L220)[[91]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L295-L295)[[92]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L315-L315)[[93]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L418-L418)[[94]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/FreesoundSearchModal.ts#L650-L650)[[95]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L236-L236)[[96]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L238-L238)[[97]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L240-L240)[[98]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L242-L242)[[99]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L1569-L1569)[[100]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L1706-L1706)[[101]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L1726-L1726)[[102]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L2179-L2179)[[103]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L561-L561)[[104]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L564-L564)[[105]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L569-L569)[[106]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L570-L570)[[107]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L672-L672)[[108]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L1045-L1045)[[109]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L1448-L1448)[[110]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L1480-L1480)[[111]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L1601-L1601)[[112]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L1824-L1824)[[113]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L3303-L3303)[[114]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L3572-L3572)[[115]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L3843-L3843)[[116]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4054-L4054)[[117]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4227-L4227)[[118]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4525-L4525)[[119]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4772-L4772)[[120]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5923-L5923)[[121]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5926-L5926)[[122]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6340-L6340)[[123]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L7301-L7301)[[124]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L7397-L7397)[[125]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L1051-L1051)[[126]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2016-L2019)[[127]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2263-L2266)[[128]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2507-L2507)[[129]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2508-L2508)[[130]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2728-L2728)[[131]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2737-L2737)[[132]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2757-L2757)[[133]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2758-L2758)[[134]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2766-L2766)[[135]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L3243-L3243)[[136]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L3640-L3640)[[137]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L3942-L3945)[[138]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L4089-L4089)[[139]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L4113-L4116)[[140]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L197-L197)[[141]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L263-L263)[[142]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L329-L332)[[143]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L421-L421)[[144]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L523-L526)[[145]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L743-L743) This assertion is unnecessary since it does not change the type of the expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/effects/EffectBusManager.ts#L113-L113) Async method 'initializeMasterEffects' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/effects/EffectBusManager.ts#L234-L234)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L793-L793)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/mapping/MetadataMappingRules.ts#L281-L281)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/export/AudioExporter.ts#L546-L546)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/visualization/NoteVisualizationManager.ts#L187-L187) Invalid type "never" of template literal expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/electronic-engine.ts#L85-L85) Async method 'initializeLeadSynth' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/electronic-engine.ts#L135-L135) Async method 'initializeBassSynth' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/electronic-engine.ts#L193-L193) Async method 'initializeArpSynth' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L68-L68)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L173-L173)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L178-L178)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L195-L195)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L203-L203)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L208-L208)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L228-L228)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L236-L236)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L241-L241)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L246-L246)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L252-L252)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L258-L258)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L263-L263)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L268-L268)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L273-L273)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L278-L278)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L283-L283)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L603-L603)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L854-L854)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L1346-L1346)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5448-L5448)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5523-L5523)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L69-L69)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L74-L74)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L76-L76)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L81-L81)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L315-L315)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L384-L384)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L468-L468)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L536-L536)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L49-L49)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L51-L51)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L53-L53)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L55-L55)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L96-L96)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L426-L426)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L601-L601)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L609-L609)[[39]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L670-L670)[[40]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L705-L705)[[41]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L707-L707)[[42]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L709-L709)[[43]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L711-L711)[[44]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L716-L716)[[45]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L726-L726)[[46]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L805-L805)[[47]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L830-L830)[[48]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L870-L870)[[49]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L875-L875)[[50]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L877-L877)[[51]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L879-L879)[[52]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L881-L881)[[53]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L883-L883)[[54]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L903-L903)[[55]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L915-L915)[[56]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L926-L926)[[57]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L928-L928)[[58]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L930-L930)[[59]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L932-L932)[[60]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L982-L982)[[61]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1050-L1050)[[62]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1088-L1088)[[63]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1107-L1107)[[64]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1598-L1598)[[65]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1600-L1600)[[66]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1602-L1602)[[67]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1630-L1630)[[68]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1633-L1633)[[69]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1647-L1647)[[70]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1649-L1649)[[71]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1651-L1651)[[72]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1653-L1653)[[73]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1668-L1668)[[74]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1680-L1680)[[75]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1682-L1682)[[76]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1684-L1684)[[77]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1693-L1693)[[78]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1702-L1702)[[79]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1705-L1705)[[80]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1718-L1718)[[81]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1720-L1720)[[82]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1725-L1725)[[83]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1730-L1730)[[84]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1735-L1735)[[85]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1748-L1748)[[86]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1751-L1751)[[87]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1765-L1765)[[88]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1770-L1770)[[89]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1775-L1775)[[90]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1830-L1830)[[91]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1849-L1849)[[92]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1851-L1851)[[93]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1853-L1853)[[94]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1855-L1855)[[95]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1858-L1858)[[96]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1869-L1869)[[97]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1884-L1884)[[98]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1886-L1886)[[99]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1888-L1888)[[100]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1890-L1890)[[101]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L2031-L2031)[[102]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L2057-L2057)[[103]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L2097-L2097)[[104]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L2148-L2148)[[105]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L2190-L2190)[[106]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L29-L29)[[107]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L31-L31)[[108]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L37-L37)[[109]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L39-L39)[[110]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L41-L41)[[111]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/LocalSoundscapeRenderer.ts#L43-L43)[[112]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/TemporalGraphAnimator.ts#L646-L646)[[113]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/TemporalGraphAnimator.ts#L648-L648)[[114]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/TemporalGraphAnimator.ts#L650-L650)[[115]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/musical-mapper.ts#L612-L612)[[116]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/types.ts#L40-L40)[[117]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/types.ts#L123-L123)[[118]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/types.ts#L125-L125)[[119]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/types.ts#L127-L127)[[120]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L2-L2)[[121]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L4-L4)[[122]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L6-L6)[[123]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L8-L8)[[124]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L10-L10)[[125]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L13-L13)[[126]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L15-L15)[[127]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L20-L20)[[128]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L30-L30)[[129]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L32-L32)[[130]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L50-L50)[[131]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L53-L53)[[132]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L59-L59)[[133]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L64-L64)[[134]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L69-L69)[[135]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L74-L74)[[136]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L87-L87)[[137]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L93-L93)[[138]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L97-L97)[[139]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L107-L107)[[140]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L150-L150)[[141]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L153-L153)[[142]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L159-L159)[[143]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/logging.ts#L201-L201)[[144]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/main.ts#L1002-L1002)[[145]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/main.ts#L1005-L1005)[[146]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L27-L27)[[147]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L29-L29)[[148]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L149-L149)[[149]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L151-L151)[[150]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L155-L155)[[151]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L193-L193)[[152]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L195-L195)[[153]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L200-L200)[[154]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L209-L209)[[155]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L211-L211)[[156]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L217-L217)[[157]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L222-L222)[[158]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L233-L233)[[159]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L235-L235)[[160]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L237-L237)[[161]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L239-L239)[[162]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L241-L241)[[163]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L302-L302)[[164]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L304-L304)[[165]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L336-L336)[[166]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/GraphDemoModal.ts#L338-L338)[[167]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L56-L56)[[168]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L1218-L1218)[[169]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/LocalSoundscapeView.ts#L2855-L2855)[[170]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L157-L157)[[171]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L230-L230)[[172]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L757-L757)[[173]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4930-L4930)[[174]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L4972-L4972)[[175]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5058-L5058)[[176]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5136-L5136)[[177]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5557-L5557)[[178]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L5679-L5679)[[179]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6247-L6247)[[180]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6475-L6475)[[181]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6599-L6599)[[182]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6762-L6762)[[183]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L6833-L6833)[[184]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L7567-L7567)[[185]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L7693-L7693)[[186]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L7902-L7902)[[187]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/SonicGraphView.ts#L8113-L8113)[[188]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L46-L46)[[189]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L50-L50)[[190]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L52-L52)[[191]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L73-L73)[[192]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L82-L82)[[193]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L87-L87)[[194]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L95-L95)[[195]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L1062-L1062)[[196]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L1074-L1074)[[197]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L1175-L1175)[[198]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2247-L2247)[[199]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2817-L2817)[[200]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L2870-L2870)[[201]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L3128-L3128)[[202]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/control-panel.ts#L3891-L3891)[[203]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L19-L19)[[204]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/ui/material-components.ts#L793-L793)[[205]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/visualization/SpectrumRenderer.ts#L70-L70) Unexpected undescribed directive comment. Include descriptions to explain why the comment is necessary.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L68-L68)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L173-L173)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L178-L178)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L195-L195)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L203-L203)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L208-L208)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L228-L228)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L236-L236)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L241-L241)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L246-L246)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L252-L252)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L258-L258)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L263-L263)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L268-L268)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L273-L273)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L278-L278)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L283-L283)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L603-L603)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L854-L854)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L1346-L1346)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5448-L5448)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/engine.ts#L5523-L5523)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L69-L69)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L74-L74)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L76-L76)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L81-L81)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L315-L315)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L384-L384)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L468-L468)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/audio/layers/MusicalGenreEngine.ts#L536-L536)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L49-L49)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L51-L51)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L53-L53)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L55-L55)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L96-L96)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L426-L426)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L601-L601)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L609-L609)[[39]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L670-L670)[[40]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L705-L705)[[41]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L707-L707)[[42]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L709-L709)[[43]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L711-L711)[[44]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L716-L716)[[45]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L726-L726)[[46]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L805-L805)[[47]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L830-L830)[[48]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L870-L870)[[49]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L875-L875)[[50]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L877-L877)[[51]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L879-L879)[[52]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L881-L881)[[53]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L883-L883)[[54]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L903-L903)[[55]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L915-L915)[[56]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L926-L926)[[57]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L928-L928)[[58]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L930-L930)[[59]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L932-L932)[[60]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L982-L982)[[61]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1050-L1050)[[62]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1088-L1088)[[63]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1107-L1107)[[64]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1598-L1598)[[65]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1600-L1600)[[66]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1602-L1602)[[67]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1630-L1630)[[68]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1633-L1633)[[69]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1647-L1647)[[70]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1649-L1649)[[71]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1651-L1651)[[72]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1653-L1653)[[73]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1668-L1668)[[74]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1680-L1680)[[75]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1682-L1682)[[76]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1684-L1684)[[77]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1693-L1693)[[78]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1702-L1702)[[79]](https://github.com/banisterious/obsidian-sonigraph/blob/b6d891c83040e1f394bc1a4402bf684497421000/src/graph/GraphRenderer.ts#L1705-L1705) Disabling '@typescript-eslint/no-explicit-any' is not allowed.

Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

Unexpected lexical declaration in case block.

Async method 'reinitializeSpecificInstruments' has no 'await' expression.

Unexpected constant condition.

Unexpected constant truthiness on the left-hand side of a `&&` expression.

A `require()` style import is forbidden.

Async method 'initializeBasicPiano' has no 'await' expression.

Async method 'initializeLightweightSynthesis' has no 'await' expression.

Async method 'reconnectInstrument' has no 'await' expression.

This assertion is unnecessary since the receiver accepts the original type of the expression.

Async method 'processQueue' has no 'await' expression.

Unexpected use of 'fetch'. Use the built-in `requestUrl` function instead of `fetch` for network requests in Obsidian.

Async method 'dispose' has no 'await' expression.

Async method 'testApiConnection' has no 'await' expression.

Unexpected `await` of a non-Promise (non-"Thenable") value.

Async method 'cleanup' has no 'await' expression.

`Transport` is deprecated. Use {@link getTransport} instead

Use sentence case for UI text.

Unexpected prompt.

Unexpected confirm.

Async method 'loadPreset' has no 'await' expression.

Async method 'savePreset' has no 'await' expression.

Async method 'deletePreset' has no 'await' expression.

Async method 'importPreset' has no 'await' expression.

Async method 'resetToDefaults' has no 'await' expression.

Unexpected console statement. Only these console methods are allowed: warn, error, debug.

Async method 'mapNode' has no 'await' expression.

Async method 'calculateComplexity' has no 'await' expression.

Async method 'analyzeImageMetadata' has no 'await' expression.

Async method 'estimateMediaDuration' has no 'await' expression.

Async method 'analyzeMediaMetadata' has no 'await' expression.

Async method 'estimatePageCount' has no 'await' expression.

Async method 'analyzeDocumentMetadata' has no 'await' expression.

Async method 'analyzeTextMetadata' has no 'await' expression.

Async method 'analyzeCodeMetadata' has no 'await' expression.

Async method 'applyMappingRules' has no 'await' expression.

Invalid type "string | number | [number, number]" of template literal expression.

`substr` is deprecated. A legacy feature for browser compatibility

Async method 'selectInstrumentFromSemantics' has no 'await' expression.

Async method 'processBatches' has no 'await' expression.

Async method 'triggerHubEmergence' has no 'await' expression.

Async method 'triggerHubDemise' has no 'await' expression.

Async method 'triggerHubShift' has no 'await' expression.

Async method 'initializeTimpani' has no 'await' expression.

Async method 'initializeXylophone' has no 'await' expression.

Async method 'initializeVibraphone' has no 'await' expression.

Async method 'initializeGongs' has no 'await' expression.

Async method 'playPhrase' has no 'await' expression.

Do not import Node.js builtin module "fs"

Do not import Node.js builtin module "path"

'error' will use Object's default stringification format ('[object Object]') when stringified.

Invalid type "ErrorEvent" of template literal expression.

Async method 'fileExists' has no 'await' expression.

Expected non-Promise value in a boolean conditional.

Async method 'proceedWithExport' has no 'await' expression.

'WavQuality' is an 'error' type that acts as 'any' and overrides all other types in this union type.

'Mp3Quality' is an 'error' type that acts as 'any' and overrides all other types in this union type.

'OggQuality' is an 'error' type that acts as 'any' and overrides all other types in this union type.

'FlacQuality' is an 'error' type that acts as 'any' and overrides all other types in this union type.

'quality.bitDepth' will use Object's default stringification format ('[object Object]') when stringified.

Invalid type "unknown" of template literal expression.

'quality.bitRate' will use Object's default stringification format ('[object Object]') when stringified.

Async method 'validateSample' has no 'await' expression.

Async method 'getCacheStats' has no 'await' expression.

Async method 'addApprovedSamples' has no 'await' expression.

Async method 'extractNodes' has no 'await' expression.

Async method 'extractFileMetadata' has no 'await' expression.

Async method 'extractEnhancedNodes' has no 'await' expression.

A method that is not declared with `this: void` may cause unintentional scoping of `this` when separated from its object. Consider using an arrow function or explicitly `.bind()`ing the method to avoid calling the method with an unintended `this` value. If a function does not access `this`, it can be annotated with `this: void`.

Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.pointerEvents`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.zIndex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Async method 'louvainClustering' has no 'await' expression.

Async method 'modularityClustering' has no 'await' expression.

Async method 'applyMultiFactorRefinement' has no 'await' expression.

Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').

Promise-returning method provided where a void return was expected by extended/implemented type 'Plugin'.

Async method 'onunload' has no 'await' expression.

Async method 'updateWhaleIntegration' has no 'await' expression.

Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-var-requires').

Expected the Promise rejection reason to be an Error.

'any' overrides all other types in this union type.

Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Async method 'exportSoundscapeAudio' has no 'await' expression.

Async method 'exportGraph' has no 'await' expression.

Async method 'pausePlayback' has no 'await' expression.

Async method 'stopPlayback' has no 'await' expression.

Async method 'getState' has no 'await' expression.

Promise returned in function argument where a void return was expected.

Async method 'onOpen' has no 'await' expression.

Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.userSelect`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Async method 'onClose' has no 'await' expression.

'value' will use Object's default stringification format ('[object Object]') when stringified.

The two values in this comparison do not have a shared enum type.

Async arrow function has no 'await' expression.

Avoid setting styles directly via `element.style.flex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.background`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.boxShadow`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.borderTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.animation`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Expected a 'break' statement before 'case'.

'status.audio.currentNotes || 0' will use Object's default stringification format ('[object Object]') when stringified.

Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Promise-returning function provided to property where a void return was expected.

Unnecessary escape character: ).
### Optional

'activeCluster' is assigned a value but never used.

'TimbreProfile' is defined but never used.

'DynamicsRange' is defined but never used.

'OrchestrationProfile' is defined but never used.

'Cluster' is defined but never used.

'FORMAT_PLACEHOLDER' is defined but never used.

'getDestination' is defined but never used.

'EffectChain' is defined but never used.

'MasterEffectsConfig' is defined but never used.

'EffectInstance' is defined but never used.

'EffectConfig' is defined but never used.

'Oscillator' is defined but never used.

'AMSynth' is defined but never used.

'FMSynth' is defined but never used.

'Sampler' is defined but never used.

'key' is assigned a value but never used.

'EQ3' is defined but never used.

'SendBus' is defined but never used.

'ReturnBus' is defined but never used.

'LoadedInstrumentConfig' is defined but never used.

'InstrumentConfig' is defined but never used.

'PlaybackProgressData' is defined but never used.

'ChordNoteEvent' is defined but never used.

'ChordGroup' is defined but never used.

'busId' is assigned a value but never used.

'instrument' is assigned a value but never used.

'e' is defined but never used.

'pitch' is assigned a value but never used.

'note' is assigned a value but never used.

'semitoneRatio' is assigned a value but never used.

'CachedSample' is defined but never used.

'FreesoundSound' is defined but never used.

'error' is defined but never used.

'CacheStatistics' is defined but never used.

'CONSONANT_INTERVALS' is assigned a value but never used.

'chordName' is assigned a value but never used.

'PolySynth' is defined but never used.

'getContext' is defined but never used.

'MusicalContext' is defined but never used.

'ChordProgression' is defined but never used.

'AutoFilter' is defined but never used.

'VaultState' is defined but never used.

'LayerPerformanceMetrics' is defined but never used.

'ChordDefinition' is defined but never used.

'LinkCache' is defined but never used.

'EmbedCache' is defined but never used.

'SliderComponent' is defined but never used.

'statusIndicator' is assigned a value but never used.

'phaseTag' is assigned a value but never used.

'CachedMetadata' is defined but never used.

'InstrumentMapping' is defined but never used.

'depthInfluence' is assigned a value but never used.

'InstrumentDistribution' is defined but never used.

'positions' is assigned a value but never used.

'fileAnalyses' is assigned a value but never used.

'totalClusters' is assigned a value but never used.

'FileCharacteristics' is defined but never used.

'AudioMappingConfig' is defined but never used.

'phrasePosition' is assigned a value but never used.

'interval' is assigned a value but never used.

'EnhancedGraphNode' is defined but never used.

'totalAge' is assigned a value but never used.

'TFile' is defined but never used.

'EmotionalMapping' is defined but never used.

'FunctionalMapping' is defined but never used.

'TopicalMapping' is defined but never used.

'currentTurnIndex' is assigned a value but never used.

'distribution' is assigned a value but never used.

'Tone' is defined but never used.

'OrchestrationMode' is defined but never used.

'DistanceScaling' is defined but never used.

'HubTransitionEffectType' is defined but never used.

'ClusterType' is defined but never used.

'attackTime' is assigned a value but never used.

'AccentMode' is defined but never used.

'isPlayingRef' is assigned a value but never used.

'ChordQuality' is defined but never used.

'interval1' is assigned a value but never used.

'interval2' is assigned a value but never used.

'NOTE_FREQUENCIES' is defined but never used.

'NOTE_NAMES' is defined but never used.

'CHORD_DEFINITIONS' is defined but never used.

'VOICE_LEADING_RULES' is defined but never used.

'validateVoiceLeading' is defined but never used.

'applyHarmonicConstraints' is defined but never used.

'nextIndex' is assigned a value but never used.

'instrumentName' is assigned a value but never used.

'pool' is assigned a value but never used.

'Notice' is defined but never used.

'file' is assigned a value but never used.

'cancelOption' is assigned a value but never used.

'overwriteOption' is assigned a value but never used.

'animDuration' is assigned a value but never used.

'QualityThreshold' is defined but never used.

'trustedSources' is assigned a value but never used.

'TFolder' is defined but never used.

'tag' is assigned a value but never used.

'folderPath' is assigned a value but never used.

'backlinkData' is assigned a value but never used.

'bestModularity' is assigned a value but never used.

'SmartClusteringAlgorithms' is defined but never used.

'App' is defined but never used.

'ButtonComponent' is defined but never used.

'DropdownComponent' is defined but never used.

'TextAreaComponent' is defined but never used.

'groupHeader' is assigned a value but never used.

'tagEl' is assigned a value but never used.

'ExtractorFilters' is defined but never used.

'title' is assigned a value but never used.

'centerNoteName' is assigned a value but never used.

'statsContainer' is assigned a value but never used.

'playbackTab' is assigned a value but never used.

'settingsTab' is assigned a value but never used.

'adaptivePitchDesc' is assigned a value but never used.

'chordVoicingDesc' is assigned a value but never used.

'playbackStartTime' is assigned a value but never used.

'Setting' is defined but never used.

'dividerHandle' is assigned a value but never used.

'timelineLine' is assigned a value but never used.

'markersContainer' is assigned a value but never used.

'headerTitle' is assigned a value but never used.

'statusText' is assigned a value but never used.

'debugHandle' is assigned a value but never used.

'toggleHandle' is assigned a value but never used.

'timeWindowLabel' is assigned a value but never used.

'timeWindowDesc' is assigned a value but never used.

'granularityLabel' is assigned a value but never used.

'granularityDesc' is assigned a value but never used.

'customRangeLabel' is assigned a value but never used.

'customRangeDesc' is assigned a value but never used.

'spreadingLabel' is assigned a value but never used.

'spreadingDesc' is assigned a value but never used.

'_markersHandle' is assigned a value but never used.

'_loopHandle' is assigned a value but never used.

'_fileNamesHandle' is assigned a value but never used.

'HarmonicSettings' is defined but never used.

'EFFECT_PRESETS' is defined but never used.

'ReverbSettings' is defined but never used.

'ChorusSettings' is defined but never used.

'FilterSettings' is defined but never used.

'getSmartRanges' is defined but never used.

'getParameterRange' is defined but never used.

'getEffectIcon' is defined but never used.

'StatCard' is defined but never used.

'InstrumentCard' is defined but never used.

'PlaybackEventType' is defined but never used.

'MusicalGenre' is defined but never used.

'PartialAudioEnhancement' is defined but never used.

'divider' is assigned a value but never used.

'thumb' is assigned a value but never used.

'enabledSetting' is assigned a value but never used.

'densitySetting' is assigned a value but never used.

'modeSetting' is assigned a value but never used.

'volumeSetting' is assigned a value but never used.

'collectionStatus' is assigned a value but never used.

'sliderSetting' is assigned a value but never used.

'setIcon' is defined but never used.

'setLucideIcon' is defined but never used.

'activeTrack' is assigned a value but never used.

'actionsDiv' is assigned a value but never used.

'MaterialCard' is defined but never used.

'SonicGraphLayersSettings' is defined but never used.

'SonicGraphFreesoundSettings' is defined but never used.

'label' is assigned a value but never used.

'secondType' is assigned a value but never used.

'intervalsStr' is assigned a value but never used.

Do NOT open a new PR for re-validation. Once you have pushed some changes to your repository the bot will rescan within 6 hours If you think some of the required changes are incorrect, please comment with `/skip` and the reason why you think the results are incorrect. To run these checks locally, install the [eslint plugin](https://github.com/obsidianmd/eslint-plugin) in your project. Do NOT rebase this PR, this will be handled by the reviewer once the plugin has been approved.

