# Gladia.SDK.Model.TranscriptionResultDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Metadata** | [**TranscriptionMetadataDTO**](TranscriptionMetadataDTO.md) | Metadata for the given transcription &amp; audio file | 
**Transcription** | [**TranscriptionDTO**](TranscriptionDTO.md) | Transcription of the audio speech | [optional] 
**Translation** | [**TranslationDTO**](TranslationDTO.md) | If &#x60;translation&#x60; has been enabled, translation of the audio speech transcription | [optional] 
**Summarization** | [**SummarizationDTO**](SummarizationDTO.md) | If &#x60;summarization&#x60; has been enabled, summarization of the audio speech transcription | [optional] 
**Moderation** | [**ModerationDTO**](ModerationDTO.md) | If &#x60;moderation&#x60; has been enabled, moderation of the audio speech transcription | [optional] 
**NamedEntityRecognition** | [**NamedEntityRecognitionDTO**](NamedEntityRecognitionDTO.md) | If &#x60;named_entity_recognition&#x60; has been enabled, the detected entities | [optional] 
**NameConsistency** | [**NamesConsistencyDTO**](NamesConsistencyDTO.md) | If &#x60;name_consistency&#x60; has been enabled, Gladia will improve consistency of the names accross the transcription | [optional] 
**SpeakerReidentification** | [**SpeakerReidentificationDTO**](SpeakerReidentificationDTO.md) | If &#x60;speaker_reidentification&#x60; has been enabled, results of the AI speaker reidentification. | [optional] 
**StructuredDataExtraction** | [**StructuredDataExtractionDTO**](StructuredDataExtractionDTO.md) | If &#x60;structured_data_extraction&#x60; has been enabled, structured data extraction results | [optional] 
**SentimentAnalysis** | [**SentimentAnalysisDTO**](SentimentAnalysisDTO.md) | If &#x60;sentiment_analysis&#x60; has been enabled, sentiment analysis of the audio speech transcription | [optional] 
**AudioToLlm** | [**AudioToLlmListDTO**](AudioToLlmListDTO.md) | If &#x60;audio_to_llm&#x60; has been enabled, audio to llm results of the audio speech transcription | [optional] 
**Sentences** | [**SentencesDTO**](SentencesDTO.md) | If &#x60;sentences&#x60; has been enabled, sentences of the audio speech transcription. Deprecated: content will move to the &#x60;transcription&#x60; object. | [optional] 
**DisplayMode** | [**DisplayModeDTO**](DisplayModeDTO.md) | If &#x60;display_mode&#x60; has been enabled, the output will be reordered, creating new utterances when speakers overlapped | [optional] 
**Chapterization** | [**ChapterizationDTO**](ChapterizationDTO.md) | If &#x60;chapterization&#x60; has been enabled, will generate chapters name for different parts of the given audio. | [optional] 
**Diarization** | [**DiarizationDTO**](DiarizationDTO.md) | If &#x60;diarization&#x60; has been requested and an error has occurred, the result will appear here | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)

