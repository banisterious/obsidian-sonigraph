Via https://github.com/obsidianmd/obsidian-releases/pull/8036#issuecomment-3525528794

Thank you for your submission, an automated scan of your plugin code's revealed the following issues:
### Required

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L191-L191) Async method 'processClusters' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L201-L203)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/playback/NoteCentricPlayer.ts#L213-L277)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L152-L152)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L145-L145)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L473-L473)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L645-L645)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L635-L635)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L645-L645)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L655-L655)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L665-L665)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L677-L677)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L692-L692)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L780-L782)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L814-L816)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L847-L849)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L873-L877)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L888-L890)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L906-L908)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L937-L941)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L1816-L1825)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L2115-L2115)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L261-L261)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L283-L285)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L290-L292)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L722-L726)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L990-L990)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3536-L3557)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3594-L3597)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3625-L3630)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3658-L3663)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3680-L3683)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3690-L3693)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3700-L3703)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3710-L3713)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L3732-L3735)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4194-L4212)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4249-L4252)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4292-L4295)[[39]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4329-L4332)[[40]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4366-L4369)[[41]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4387-L4390)[[42]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4408-L4411)[[43]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4429-L4432)[[44]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4494-L4510)[[45]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4540-L4543)[[46]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4566-L4573)[[47]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4596-L4603)[[48]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4626-L4633)[[49]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4651-L4654)[[50]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4716-L4757)[[51]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4801-L4804)[[52]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4827-L4834)[[53]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4865-L4868)[[54]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4886-L4889)[[55]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L5349-L5364)[[56]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6029-L6054)[[57]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/components.ts#L87-L128)[[58]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L272-L272)[[59]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1116-L1118)[[60]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1145-L1147)[[61]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1154-L1156)[[62]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1347-L1347)[[63]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1477-L1484)[[64]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1499-L1506)[[65]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1688-L1695)[[66]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1709-L1716)[[67]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1888-L1895)[[68]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L2141-L2152)[[69]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L3043-L3043)[[70]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L3085-L3085)[[71]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L3092-L3092)[[72]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L4047-L4068)[[73]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/LocalSoundscapeSettings.ts#L208-L208)[[74]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/LocalSoundscapeSettings.ts#L580-L580)[[75]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/LocalSoundscapeSettings.ts#L612-L612)[[76]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/LocalSoundscapeSettings.ts#L764-L764)[[77]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/LocalSoundscapeSettings.ts#L893-L893)[[78]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/SonicGraphFreesoundSettings.ts#L100-L100)[[79]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/settings/SonicGraphFreesoundSettings.ts#L126-L126) Promise returned in function argument where a void return was expected.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L462-L462) Async method 'executeGlissando' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L491-L491)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L680-L680) Async method 'executeHarmonicBuildup' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L494-L494)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L534-L534)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L573-L573)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L1048-L1048)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterThemeGenerator.ts#L443-L443)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityAudioAnalyzer.ts#L404-L404)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L424-L424)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L476-L476)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L511-L511)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L547-L547)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L583-L583)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L608-L608)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L643-L643)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L682-L682)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L714-L714)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityEvolutionTracker.ts#L784-L784)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/CommunityThemeGenerator.ts#L497-L497)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/types.ts#L141-L141)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/types.ts#L142-L142)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L23-L23)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L24-L24)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L32-L32)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L190-L190)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L242-L242)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L273-L273)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L273-L273)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/EffectBusManager.ts#L408-L408)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/types.ts#L7-L7)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/effects/types.ts#L91-L91)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L35-L35)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L67-L67)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L88-L88)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L119-L119)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L121-L121)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L171-L171)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L175-L175)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L191-L191)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L198-L198)[[39]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L202-L202)[[40]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L221-L221)[[41]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L228-L228)[[42]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L232-L232)[[43]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L236-L236)[[44]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L241-L241)[[45]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L246-L246)[[46]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L250-L250)[[47]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L254-L254)[[48]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L258-L258)[[49]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L262-L262)[[50]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L266-L266)[[51]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L275-L275)[[52]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L585-L585)[[53]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L835-L835)[[54]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L939-L939)[[55]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L951-L951)[[56]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L1326-L1326)[[57]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L1509-L1509)[[58]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L3176-L3176)[[59]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L3183-L3183)[[60]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L3931-L3931)[[61]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L3964-L3964)[[62]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L5207-L5207)[[63]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L5427-L5427)[[64]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L5501-L5501)[[65]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L5965-L5965)[[66]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/HarmonicLayerManager.ts#L77-L77)[[67]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/HarmonicLayerManager.ts#L353-L353)[[68]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L61-L61)[[69]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L67-L67)[[70]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L71-L71)[[71]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L72-L72)[[72]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L76-L76)[[73]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L83-L83)[[74]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L95-L95)[[75]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L309-L309)[[76]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L330-L330)[[77]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L377-L377)[[78]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L460-L460)[[79]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L527-L527)[[80]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/MusicalGenreEngine.ts#L1058-L1058)[[81]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/RhythmicLayerManager.ts#L75-L75)[[82]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/RhythmicLayerManager.ts#L327-L327)[[83]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ConnectionTypePresetManager.ts#L394-L394)[[84]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ConnectionTypePresetManager.ts#L395-L395)[[85]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ContentAwareMapper.ts#L1071-L1071)[[86]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ContentAwareMapper.ts#L1542-L1542)[[87]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/DepthBasedMapper.ts#L822-L822)[[88]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/DepthBasedMapper.ts#L1011-L1011)[[89]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/DepthBasedMapper.ts#L1130-L1130)[[90]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/InstrumentSelector.ts#L30-L30)[[91]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/InstrumentSelector.ts#L34-L34)[[92]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/InstrumentSelector.ts#L35-L35)[[93]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataListener.ts#L286-L286)[[94]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataMappingRules.ts#L20-L20)[[95]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataMappingRules.ts#L70-L70)[[96]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataMappingRules.ts#L71-L71)[[97]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataMappingRules.ts#L72-L72)[[98]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataMappingRules.ts#L617-L617)[[99]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ObsidianMetadataMapper.ts#L334-L334)[[100]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ObsidianMetadataMapper.ts#L362-L362)[[101]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/ObsidianMetadataMapper.ts#L378-L378)[[102]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/theory/types.ts#L196-L196)[[103]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/AudioExporter.ts#L36-L36)[[104]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/AudioExporter.ts#L39-L39)[[105]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/AudioExporter.ts#L344-L344)[[106]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/AudioExporter.ts#L735-L735)[[107]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L158-L158)[[108]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L172-L172)[[109]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L869-L869)[[110]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L869-L869)[[111]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L879-L879)[[112]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L32-L32)[[113]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L33-L33)[[114]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L100-L100)[[115]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L101-L101)[[116]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L178-L178)[[117]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L321-L321)[[118]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportNoteCreator.ts#L354-L354)[[119]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/external/whale-integration.ts#L179-L179)[[120]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/ContentAwarePositioning.ts#L309-L309)[[121]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L49-L49)[[122]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L50-L50)[[123]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L51-L51)[[124]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L52-L52)[[125]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L92-L92)[[126]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L421-L421)[[127]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L595-L595)[[128]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L602-L602)[[129]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L662-L662)[[130]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L696-L696)[[131]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L697-L697)[[132]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L698-L698)[[133]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L699-L699)[[134]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L703-L703)[[135]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L712-L712)[[136]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L790-L790)[[137]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L814-L814)[[138]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L853-L853)[[139]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L857-L857)[[140]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L858-L858)[[141]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L859-L859)[[142]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L860-L860)[[143]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L861-L861)[[144]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L880-L880)[[145]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L891-L891)[[146]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L901-L901)[[147]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L902-L902)[[148]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L903-L903)[[149]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L904-L904)[[150]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L953-L953)[[151]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1020-L1020)[[152]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1057-L1057)[[153]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1075-L1075)[[154]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1590-L1590)[[155]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1590-L1590)[[156]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1592-L1592)[[157]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1605-L1605)[[158]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1606-L1606)[[159]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1607-L1607)[[160]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1608-L1608)[[161]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1622-L1622)[[162]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1633-L1633)[[163]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1634-L1634)[[164]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1635-L1635)[[165]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1643-L1643)[[166]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1651-L1651)[[167]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1651-L1651)[[168]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1653-L1653)[[169]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1665-L1665)[[170]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1666-L1666)[[171]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1670-L1670)[[172]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1674-L1674)[[173]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1678-L1678)[[174]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1690-L1690)[[175]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1690-L1690)[[176]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1692-L1692)[[177]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1705-L1705)[[178]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1709-L1709)[[179]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1713-L1713)[[180]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1767-L1767)[[181]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1785-L1785)[[182]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1786-L1786)[[183]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1787-L1787)[[184]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1788-L1788)[[185]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1790-L1790)[[186]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1800-L1800)[[187]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1814-L1814)[[188]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1815-L1815)[[189]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1816-L1816)[[190]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1817-L1817)[[191]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1957-L1957)[[192]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1982-L1982)[[193]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L2021-L2021)[[194]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L2071-L2071)[[195]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L2112-L2112)[[196]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeExtractor.ts#L39-L39)[[197]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L29-L29)[[198]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L30-L30)[[199]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L35-L35)[[200]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L36-L36)[[201]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L37-L37)[[202]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/LocalSoundscapeRenderer.ts#L38-L38)[[203]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/SmartClusteringAlgorithms.ts#L892-L892)[[204]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L63-L63)[[205]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L64-L64)[[206]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L65-L65)[[207]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L409-L409)[[208]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L425-L425)[[209]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L1010-L1010)[[210]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L1011-L1011)[[211]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/TemporalGraphAnimator.ts#L1012-L1012)[[212]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/musical-mapper.ts#L612-L612)[[213]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/musical-mapper.ts#L1024-L1024)[[214]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/musical-mapper.ts#L1041-L1041)[[215]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/types.ts#L40-L40)[[216]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/types.ts#L58-L58)[[217]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/types.ts#L122-L122)[[218]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/types.ts#L123-L123)[[219]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/types.ts#L124-L124)[[220]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L3-L3)[[221]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L4-L4)[[222]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L5-L5)[[223]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L6-L6)[[224]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L8-L8)[[225]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L9-L9)[[226]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L13-L13)[[227]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L22-L22)[[228]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L23-L23)[[229]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L40-L40)[[230]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L42-L42)[[231]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L47-L47)[[232]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L51-L51)[[233]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L55-L55)[[234]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L59-L59)[[235]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L71-L71)[[236]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L76-L76)[[237]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L79-L79)[[238]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L88-L88)[[239]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L130-L130)[[240]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L132-L132)[[241]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L137-L137)[[242]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/logging.ts#L178-L178)[[243]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L21-L21)[[244]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L484-L484)[[245]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L485-L485)[[246]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L594-L594)[[247]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L1002-L1002)[[248]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L1013-L1013)[[249]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L629-L629)[[250]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L27-L27)[[251]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L28-L28)[[252]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L148-L148)[[253]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L151-L151)[[254]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L189-L189)[[255]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L193-L193)[[256]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L202-L202)[[257]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L207-L207)[[258]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L211-L211)[[259]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L222-L222)[[260]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L223-L223)[[261]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L224-L224)[[262]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L225-L225)[[263]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L286-L286)[[264]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/GraphDemoModal.ts#L318-L318)[[265]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L56-L56)[[266]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L1217-L1217)[[267]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/LocalSoundscapeView.ts#L2851-L2851)[[268]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L224-L224)[[269]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L335-L335)[[270]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L395-L395)[[271]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L574-L574)[[272]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L601-L601)[[273]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SampleTableBrowser.ts#L615-L615)[[274]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L69-L69)[[275]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L157-L157)[[276]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L157-L157)[[277]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L229-L229)[[278]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L755-L755)[[279]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4927-L4927)[[280]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L4968-L4968)[[281]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L5053-L5053)[[282]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L5130-L5130)[[283]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L5550-L5550)[[284]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L5671-L5671)[[285]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6238-L6238)[[286]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6465-L6465)[[287]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6588-L6588)[[288]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6750-L6750)[[289]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L6820-L6820)[[290]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L7553-L7553)[[291]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L7678-L7678)[[292]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L7886-L7886)[[293]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/SonicGraphView.ts#L8096-L8096)[[294]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L46-L46)[[295]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L49-L49)[[296]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L50-L50)[[297]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L70-L70)[[298]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L78-L78)[[299]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L82-L82)[[300]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L89-L89)[[301]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1055-L1055)[[302]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1066-L1066)[[303]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L1166-L1166)[[304]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L2237-L2237)[[305]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L2806-L2806)[[306]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L2858-L2858)[[307]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L3115-L3115)[[308]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/control-panel.ts#L3877-L3877)[[309]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/material-components.ts#L19-L19)[[310]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/material-components.ts#L792-L792)[[311]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L512-L512)[[312]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L548-L548)[[313]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L660-L660)[[314]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L661-L661)[[315]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L662-L662)[[316]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/utils/constants.ts#L3093-L3093)[[317]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/visualization/SpectrumRenderer.ts#L70-L70) Unexpected any. Specify a different type.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L531-L531) Async method 'executeFilterSweep' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L570-L570) Async method 'executeGranularScatter' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L792-L792) Async method 'playClusterAudio' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L820-L820) Async method 'updateClusterAudio' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L850-L850) Async method 'stopClusterAudio' has no 'await' expression.

[[1]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L914-L914)[[2]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/clustering/ClusterAudioMapper.ts#L1154-L1154)[[3]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L215-L215)[[4]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L2168-L2168)[[5]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/engine.ts#L2533-L2533)[[6]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/DownloadQueue.ts#L87-L87)[[7]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/DownloadQueue.ts#L197-L200)[[8]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/DownloadQueue.ts#L199-L199)[[9]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/DownloadQueue.ts#L390-L390)[[10]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/FreesoundSampleManager.ts#L542-L542)[[11]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/freesound/SamplePreloader.ts#L163-L163)[[12]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/HarmonicLayerManager.ts#L324-L324)[[13]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/HarmonicLayerManager.ts#L518-L518)[[14]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/layers/HarmonicLayerManager.ts#L610-L610)[[15]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataListener.ts#L312-L312)[[16]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataListener.ts#L320-L320)[[17]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/audio/mapping/MetadataListener.ts#L324-L324)[[18]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L662-L662)[[19]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportModal.ts#L766-L766)[[20]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/ExportProgressModal.ts#L72-L72)[[21]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/export/Mp3Encoder.ts#L118-L118)[[22]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/external/freesound/whale-audio-manager.ts#L146-L146)[[23]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L324-L324)[[24]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/GraphRenderer.ts#L1231-L1231)[[25]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/musical-mapper.ts#L71-L71)[[26]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/graph/musical-mapper.ts#L103-L103)[[27]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L53-L53)[[28]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L61-L61)[[29]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L70-L70)[[30]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L254-L254)[[31]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L312-L312)[[32]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L364-L364)[[33]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L454-L454)[[34]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L523-L523)[[35]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/main.ts#L900-L900)[[36]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/templates/ui/TemplateTabsModal.ts#L654-L654)[[37]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L117-L117)[[38]](https://github.com/banisterious/obsidian-sonigraph/blob/cc382960d9d130c330858e281563a31a5c37862a/src/ui/FreesoundSearchModal.ts#L172-L172) Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

Async method 'initialize' has no 'await' expression.

Async method 'executeHarmonicConvergence' has no 'await' expression.

Async method 'executeDivergentHarmony' has no 'await' expression.

Async method 'executeExpandingOrchestration' has no 'await' expression.

Async method 'executeFadingVoices' has no 'await' expression.

Async method 'executeCrossFade' has no 'await' expression.

Async method 'executeHarmonicFadeout' has no 'await' expression.

This assertion is unnecessary since it does not change the type of the expression.

Async method 'initializeMasterEffects' has no 'await' expression.

Invalid type "never" of template literal expression.

Async method 'initializeLeadSynth' has no 'await' expression.

Async method 'initializeBassSynth' has no 'await' expression.

Async method 'initializeArpSynth' has no 'await' expression.

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

Promise-returning method provided where a void return was expected by extended/implemented type 'Plugin'.

Async method 'onunload' has no 'await' expression.

Async method 'updateWhaleIntegration' has no 'await' expression.

Expected the Promise rejection reason to be an Error.

'any' overrides all other types in this union type.

Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Async method 'exportSoundscapeAudio' has no 'await' expression.

Async method 'exportGraph' has no 'await' expression.

Async method 'pausePlayback' has no 'await' expression.

Async method 'stopPlayback' has no 'await' expression.

Async method 'getState' has no 'await' expression.

Async method 'onOpen' has no 'await' expression.

Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Avoid setting styles directly via `element.style.userSelect`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties.

Async method 'onClose' has no 'await' expression.

'value' will use Object's default stringification format ('[object Object]') when stringified.

Invalid type "unknown" of template literal expression.

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

'InstrumentConfig' is defined but never used.

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

