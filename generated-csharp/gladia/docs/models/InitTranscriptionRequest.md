# Gladia.SDK.Model.InitTranscriptionRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**AudioUrl** | **string** | URL to a Gladia file or to an external audio or video file | 
**ContextPrompt** | **string** | **[Deprecated]** Context to feed the transcription model with for possible better accuracy | [optional] 
**CustomVocabulary** | **bool** | **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with | [optional] [default to false]
**CustomVocabularyConfig** | [**CustomVocabularyConfigDTO**](CustomVocabularyConfigDTO.md) | **[Beta]** Custom vocabulary configuration, if &#x60;custom_vocabulary&#x60; is enabled | [optional] 
**DetectLanguage** | **bool** | **[Deprecated]** Use &#x60;language_config&#x60; instead. Detect the language from the given audio | [optional] [default to true]
**EnableCodeSwitching** | **bool** | **[Deprecated]** Use &#x60;language_config&#x60; instead.Detect multiple languages in the given audio | [optional] [default to false]
**CodeSwitchingConfig** | [**CodeSwitchingConfigDTO**](CodeSwitchingConfigDTO.md) | **[Deprecated]** Use &#x60;language_config&#x60; instead. Specify the configuration for code switching | [optional] 
**Language** | **TranscriptionLanguageCodeEnum** | **[Deprecated]** Use &#x60;language_config&#x60; instead. Set the spoken language for the given audio (ISO 639 standard) | [optional] 
**CallbackUrl** | **string** | **[Deprecated]** Use &#x60;callback&#x60;/&#x60;callback_config&#x60; instead. Callback URL we will do a &#x60;POST&#x60; request to with the result of the transcription | [optional] 
**Callback** | **bool** | Enable callback for this transcription. If true, the &#x60;callback_config&#x60; property will be used to customize the callback behaviour | [optional] [default to false]
**CallbackConfig** | [**CallbackConfigDto**](CallbackConfigDto.md) | Customize the callback behaviour (url and http method) | [optional] 
**Subtitles** | **bool** | Enable subtitles generation for this transcription | [optional] [default to false]
**SubtitlesConfig** | [**SubtitlesConfigDTO**](SubtitlesConfigDTO.md) | Configuration for subtitles generation if &#x60;subtitles&#x60; is enabled | [optional] 
**Diarization** | **bool** | Enable speaker recognition (diarization) for this audio | [optional] [default to false]
**DiarizationConfig** | [**DiarizationConfigDTO**](DiarizationConfigDTO.md) | Speaker recognition configuration, if &#x60;diarization&#x60; is enabled | [optional] 
**Translation** | **bool** | **[Beta]** Enable translation for this audio | [optional] [default to false]
**TranslationConfig** | [**TranslationConfigDTO**](TranslationConfigDTO.md) | **[Beta]** Translation configuration, if &#x60;translation&#x60; is enabled | [optional] 
**Summarization** | **bool** | **[Beta]** Enable summarization for this audio | [optional] [default to false]
**SummarizationConfig** | [**SummarizationConfigDTO**](SummarizationConfigDTO.md) | **[Beta]** Summarization configuration, if &#x60;summarization&#x60; is enabled | [optional] 
**Moderation** | **bool** | **[Alpha]** Enable moderation for this audio | [optional] [default to false]
**NamedEntityRecognition** | **bool** | **[Alpha]** Enable named entity recognition for this audio | [optional] [default to false]
**Chapterization** | **bool** | **[Alpha]** Enable chapterization for this audio | [optional] [default to false]
**NameConsistency** | **bool** | **[Alpha]** Enable names consistency for this audio | [optional] [default to false]
**CustomSpelling** | **bool** | **[Alpha]** Enable custom spelling for this audio | [optional] [default to false]
**CustomSpellingConfig** | [**CustomSpellingConfigDTO**](CustomSpellingConfigDTO.md) | **[Alpha]** Custom spelling configuration, if &#x60;custom_spelling&#x60; is enabled | [optional] 
**StructuredDataExtraction** | **bool** | **[Alpha]** Enable structured data extraction for this audio | [optional] [default to false]
**StructuredDataExtractionConfig** | [**StructuredDataExtractionConfigDTO**](StructuredDataExtractionConfigDTO.md) | **[Alpha]** Structured data extraction configuration, if &#x60;structured_data_extraction&#x60; is enabled | [optional] 
**SentimentAnalysis** | **bool** | Enable sentiment analysis for this audio | [optional] [default to false]
**AudioToLlm** | **bool** | **[Alpha]** Enable audio to llm processing for this audio | [optional] [default to false]
**AudioToLlmConfig** | [**AudioToLlmListConfigDTO**](AudioToLlmListConfigDTO.md) | **[Alpha]** Audio to llm configuration, if &#x60;audio_to_llm&#x60; is enabled | [optional] 
**CustomMetadata** | **Dictionary&lt;string, Object&gt;** | Custom metadata you can attach to this transcription | [optional] 
**Sentences** | **bool** | Enable sentences for this audio | [optional] [default to false]
**DisplayMode** | **bool** | **[Alpha]** Allows to change the output display_mode for this audio. The output will be reordered, creating new utterances when speakers overlapped | [optional] [default to false]
**PunctuationEnhanced** | **bool** | **[Alpha]** Use enhanced punctuation for this audio | [optional] [default to false]
**LanguageConfig** | [**LanguageConfig**](LanguageConfig.md) | Specify the language configuration | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)

