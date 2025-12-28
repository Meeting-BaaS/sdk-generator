# TranscriptionResultDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**metadata** | [**models::TranscriptionMetadataDto**](TranscriptionMetadataDTO.md) | Metadata for the given transcription & audio file | 
**transcription** | Option<[**models::TranscriptionDto**](TranscriptionDTO.md)> | Transcription of the audio speech | [optional]
**translation** | Option<[**models::TranslationDto**](TranslationDTO.md)> | If `translation` has been enabled, translation of the audio speech transcription | [optional]
**summarization** | Option<[**models::SummarizationDto**](SummarizationDTO.md)> | If `summarization` has been enabled, summarization of the audio speech transcription | [optional]
**moderation** | Option<[**models::ModerationDto**](ModerationDTO.md)> | If `moderation` has been enabled, moderation of the audio speech transcription | [optional]
**named_entity_recognition** | Option<[**models::NamedEntityRecognitionDto**](NamedEntityRecognitionDTO.md)> | If `named_entity_recognition` has been enabled, the detected entities | [optional]
**name_consistency** | Option<[**models::NamesConsistencyDto**](NamesConsistencyDTO.md)> | If `name_consistency` has been enabled, Gladia will improve consistency of the names accross the transcription | [optional]
**speaker_reidentification** | Option<[**models::SpeakerReidentificationDto**](SpeakerReidentificationDTO.md)> | If `speaker_reidentification` has been enabled, results of the AI speaker reidentification. | [optional]
**structured_data_extraction** | Option<[**models::StructuredDataExtractionDto**](StructuredDataExtractionDTO.md)> | If `structured_data_extraction` has been enabled, structured data extraction results | [optional]
**sentiment_analysis** | Option<[**models::SentimentAnalysisDto**](SentimentAnalysisDTO.md)> | If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription | [optional]
**audio_to_llm** | Option<[**models::AudioToLlmListDto**](AudioToLlmListDTO.md)> | If `audio_to_llm` has been enabled, audio to llm results of the audio speech transcription | [optional]
**sentences** | Option<[**models::SentencesDto**](SentencesDTO.md)> | If `sentences` has been enabled, sentences of the audio speech transcription. Deprecated: content will move to the `transcription` object. | [optional]
**display_mode** | Option<[**models::DisplayModeDto**](DisplayModeDTO.md)> | If `display_mode` has been enabled, the output will be reordered, creating new utterances when speakers overlapped | [optional]
**chapterization** | Option<[**models::ChapterizationDto**](ChapterizationDTO.md)> | If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. | [optional]
**diarization** | Option<[**models::DiarizationDto**](DiarizationDTO.md)> | If `diarization` has been requested and an error has occurred, the result will appear here | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


