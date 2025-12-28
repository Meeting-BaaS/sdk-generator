# InitTranscriptionRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context_prompt** | Option<**String**> | **[Deprecated]** Context to feed the transcription model with for possible better accuracy | [optional]
**custom_vocabulary** | Option<**bool**> | **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with | [optional][default to false]
**custom_vocabulary_config** | Option<[**models::CustomVocabularyConfigDto**](CustomVocabularyConfigDTO.md)> | **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled | [optional]
**detect_language** | Option<**bool**> | **[Deprecated]** Use `language_config` instead. Detect the language from the given audio | [optional][default to true]
**enable_code_switching** | Option<**bool**> | **[Deprecated]** Use `language_config` instead.Detect multiple languages in the given audio | [optional][default to false]
**code_switching_config** | Option<[**models::CodeSwitchingConfigDto**](CodeSwitchingConfigDTO.md)> | **[Deprecated]** Use `language_config` instead. Specify the configuration for code switching | [optional]
**language** | Option<[**models::TranscriptionLanguageCodeEnum**](TranscriptionLanguageCodeEnum.md)> | **[Deprecated]** Use `language_config` instead. Set the spoken language for the given audio (ISO 639 standard) | [optional]
**callback_url** | Option<**String**> | **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription | [optional]
**callback** | Option<**bool**> | Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour | [optional][default to false]
**callback_config** | Option<[**models::CallbackConfigDto**](CallbackConfigDto.md)> | Customize the callback behaviour (url and http method) | [optional]
**subtitles** | Option<**bool**> | Enable subtitles generation for this transcription | [optional][default to false]
**subtitles_config** | Option<[**models::SubtitlesConfigDto**](SubtitlesConfigDTO.md)> | Configuration for subtitles generation if `subtitles` is enabled | [optional]
**diarization** | Option<**bool**> | Enable speaker recognition (diarization) for this audio | [optional][default to false]
**diarization_config** | Option<[**models::DiarizationConfigDto**](DiarizationConfigDTO.md)> | Speaker recognition configuration, if `diarization` is enabled | [optional]
**translation** | Option<**bool**> | **[Beta]** Enable translation for this audio | [optional][default to false]
**translation_config** | Option<[**models::TranslationConfigDto**](TranslationConfigDTO.md)> | **[Beta]** Translation configuration, if `translation` is enabled | [optional]
**summarization** | Option<**bool**> | **[Beta]** Enable summarization for this audio | [optional][default to false]
**summarization_config** | Option<[**models::SummarizationConfigDto**](SummarizationConfigDTO.md)> | **[Beta]** Summarization configuration, if `summarization` is enabled | [optional]
**moderation** | Option<**bool**> | **[Alpha]** Enable moderation for this audio | [optional][default to false]
**named_entity_recognition** | Option<**bool**> | **[Alpha]** Enable named entity recognition for this audio | [optional][default to false]
**chapterization** | Option<**bool**> | **[Alpha]** Enable chapterization for this audio | [optional][default to false]
**name_consistency** | Option<**bool**> | **[Alpha]** Enable names consistency for this audio | [optional][default to false]
**custom_spelling** | Option<**bool**> | **[Alpha]** Enable custom spelling for this audio | [optional][default to false]
**custom_spelling_config** | Option<[**models::CustomSpellingConfigDto**](CustomSpellingConfigDTO.md)> | **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled | [optional]
**structured_data_extraction** | Option<**bool**> | **[Alpha]** Enable structured data extraction for this audio | [optional][default to false]
**structured_data_extraction_config** | Option<[**models::StructuredDataExtractionConfigDto**](StructuredDataExtractionConfigDTO.md)> | **[Alpha]** Structured data extraction configuration, if `structured_data_extraction` is enabled | [optional]
**sentiment_analysis** | Option<**bool**> | Enable sentiment analysis for this audio | [optional][default to false]
**audio_to_llm** | Option<**bool**> | **[Alpha]** Enable audio to llm processing for this audio | [optional][default to false]
**audio_to_llm_config** | Option<[**models::AudioToLlmListConfigDto**](AudioToLlmListConfigDTO.md)> | **[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled | [optional]
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> | Custom metadata you can attach to this transcription | [optional]
**sentences** | Option<**bool**> | Enable sentences for this audio | [optional][default to false]
**display_mode** | Option<**bool**> | **[Alpha]** Allows to change the output display_mode for this audio. The output will be reordered, creating new utterances when speakers overlapped | [optional][default to false]
**punctuation_enhanced** | Option<**bool**> | **[Alpha]** Use enhanced punctuation for this audio | [optional][default to false]
**language_config** | Option<[**models::LanguageConfig**](LanguageConfig.md)> | Specify the language configuration | [optional]
**audio_url** | **String** | URL to a Gladia file or to an external audio or video file | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


