# Transcript

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | The unique identifier of your transcript | 
**audio_url** | **String** | The URL of the media that was transcribed | 
**status** | [**models::TranscriptStatus**](TranscriptStatus.md) | The status of your transcript. Possible values are queued, processing, completed, or error. | 
**language_code** | Option<[**models::TranscriptLanguageCode**](Transcript_language_code.md)> |  | [optional]
**language_codes** | Option<[**Vec<models::TranscriptLanguageCode>**](TranscriptLanguageCode.md)> | The language codes of your audio file. Used for [Code switching](/docs/speech-to-text/pre-recorded-audio/code-switching) One of the values specified must be `en`.  | [optional]
**language_detection** | Option<**bool**> | Whether [Automatic language detection](/docs/pre-recorded-audio/automatic-language-detection) is enabled, either true or false | [optional]
**language_detection_options** | Option<[**models::TranscriptOptionalParamsLanguageDetectionOptions**](TranscriptOptionalParams_language_detection_options.md)> |  | [optional]
**language_confidence_threshold** | Option<**f32**> | The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold.  | 
**language_confidence** | Option<**f64**> | The confidence score for the detected language, between 0.0 (low confidence) and 1.0 (high confidence) | 
**speech_model** | Option<[**models::SpeechModel**](SpeechModel.md)> |  | 
**speech_models** | Option<[**Vec<models::SpeechModel>**](SpeechModel.md)> | List multiple speech models in priority order, allowing our system to automatically route your audio to the best available option.  | [optional]
**speech_model_used** | Option<[**models::SpeechModel**](SpeechModel.md)> | The speech model that was actually used for the transcription. | [optional]
**text** | Option<**String**> | The textual transcript of your media file | [optional]
**words** | Option<[**Vec<models::TranscriptWord>**](TranscriptWord.md)> | An array of temporally-sequential word objects, one for each word in the transcript. See [Speech recognition](https://www.assemblyai.com/docs/models/speech-recognition) for more information.  | [optional]
**utterances** | Option<[**Vec<models::TranscriptUtterance>**](TranscriptUtterance.md)> | When multichannel or speaker_labels is enabled, a list of turn-by-turn utterance objects. See [Speaker diarization](https://www.assemblyai.com/docs/speech-to-text/speaker-diarization) and [Multichannel transcription](https://www.assemblyai.com/docs/speech-to-text/speech-recognition#multichannel-transcription) for more information.  | [optional]
**confidence** | Option<**f64**> | The confidence score for the transcript, between 0.0 (low confidence) and 1.0 (high confidence) | [optional]
**audio_duration** | Option<**i32**> | The duration of this transcript object's media file, in seconds | [optional]
**punctuate** | Option<**bool**> | Whether Automatic Punctuation is enabled, either true or false | [optional]
**format_text** | Option<**bool**> | Whether Text Formatting is enabled, either true or false | [optional]
**disfluencies** | Option<**bool**> | Transcribe Filler Words, like \"umm\", in your media file; can be true or false | [optional]
**multichannel** | Option<**bool**> | Whether [Multichannel transcription](https://www.assemblyai.com/docs/models/speech-recognition#multichannel-transcription) was enabled in the transcription request, either true or false | [optional]
**audio_channels** | Option<**i32**> | The number of audio channels in the audio file. This is only present when multichannel is enabled. | [optional]
**webhook_url** | Option<**String**> | The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.  | [optional]
**webhook_status_code** | Option<**i32**> | The status code we received from your server when delivering the transcript completed or failed webhook request, if a webhook URL was provided | [optional]
**webhook_auth** | **bool** | Whether webhook authentication details were provided | 
**webhook_auth_header_name** | Option<**String**> | The header name to be sent with the transcript completed or failed webhook requests | [optional]
**speed_boost** | Option<**bool**> | Whether speed boost is enabled | [optional]
**auto_highlights** | **bool** | Whether Key Phrases is enabled, either true or false | 
**auto_highlights_result** | Option<[**models::AutoHighlightsResult**](AutoHighlightsResult.md)> |  | [optional]
**audio_start_from** | Option<**i32**> | The point in time, in milliseconds, in the file at which the transcription was started | [optional]
**audio_end_at** | Option<**i32**> | The point in time, in milliseconds, in the file at which the transcription was terminated | [optional]
**filter_profanity** | Option<**bool**> | Whether [Profanity Filtering](https://www.assemblyai.com/docs/models/speech-recognition#profanity-filtering) is enabled, either true or false | [optional]
**redact_pii** | **bool** | Whether [PII Redaction](https://www.assemblyai.com/docs/models/pii-redaction) is enabled, either true or false | 
**redact_pii_audio** | Option<**bool**> | Whether a redacted version of the audio file was generated, either true or false. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more information.  | [optional]
**redact_pii_audio_quality** | Option<[**models::RedactPiiAudioQuality**](RedactPiiAudioQuality.md)> |  | [optional]
**redact_pii_policies** | Option<[**Vec<models::PiiPolicy>**](PiiPolicy.md)> | The list of PII Redaction policies that were enabled, if PII Redaction is enabled. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more information.  | [optional]
**redact_pii_sub** | Option<[**models::SubstitutionPolicy**](SubstitutionPolicy.md)> | The replacement logic for detected PII, can be `entity_type` or `hash`. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details. | [optional]
**speaker_labels** | Option<**bool**> | Whether [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization) is enabled, can be true or false | [optional]
**speakers_expected** | Option<**i32**> | Tell the speaker label model how many speakers it should attempt to identify. See [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization) for more details. | [optional]
**content_safety** | Option<**bool**> | Whether [Content Moderation](https://www.assemblyai.com/docs/models/content-moderation) is enabled, can be true or false | [optional]
**content_safety_labels** | Option<[**models::ContentSafetyLabelsResult**](ContentSafetyLabelsResult.md)> |  | [optional]
**iab_categories** | Option<**bool**> | Whether [Topic Detection](https://www.assemblyai.com/docs/models/topic-detection) is enabled, can be true or false | [optional]
**iab_categories_result** | Option<[**models::TopicDetectionModelResult**](TopicDetectionModelResult.md)> |  | [optional]
**custom_spelling** | Option<[**Vec<models::TranscriptCustomSpelling>**](TranscriptCustomSpelling.md)> | Customize how words are spelled and formatted using to and from values | [optional]
**keyterms_prompt** | Option<**Vec<String>**> | Improve accuracy with up to 200 (for Universal) or 1000 (for Slam-1) domain-specific words or phrases (maximum 6 words per phrase).  | [optional]
**prompt** | Option<**String**> | This parameter does not currently have any functionality attached to it. | [optional]
**auto_chapters** | Option<**bool**> | Whether [Auto Chapters](https://www.assemblyai.com/docs/models/auto-chapters) is enabled, can be true or false | [optional]
**chapters** | Option<[**Vec<models::Chapter>**](Chapter.md)> | An array of temporally sequential chapters for the audio file | [optional]
**summarization** | **bool** | Whether [Summarization](https://www.assemblyai.com/docs/models/summarization) is enabled, either true or false | 
**summary_type** | Option<**String**> | The type of summary generated, if [Summarization](https://www.assemblyai.com/docs/models/summarization) is enabled | [optional]
**summary_model** | Option<**String**> | The Summarization model used to generate the summary, if [Summarization](https://www.assemblyai.com/docs/models/summarization) is enabled  | [optional]
**summary** | Option<**String**> | The generated summary of the media file, if [Summarization](https://www.assemblyai.com/docs/models/summarization) is enabled | [optional]
**custom_topics** | Option<**bool**> | Whether custom topics is enabled, either true or false | [optional]
**topics** | Option<**Vec<String>**> | The list of custom topics provided if custom topics is enabled | [optional]
**sentiment_analysis** | Option<**bool**> | Whether [Sentiment Analysis](https://www.assemblyai.com/docs/models/sentiment-analysis) is enabled, can be true or false | [optional]
**sentiment_analysis_results** | Option<[**Vec<models::SentimentAnalysisResult>**](SentimentAnalysisResult.md)> | An array of results for the Sentiment Analysis model, if it is enabled. See [Sentiment Analysis](https://www.assemblyai.com/docs/models/sentiment-analysis) for more information.  | [optional]
**entity_detection** | Option<**bool**> | Whether [Entity Detection](https://www.assemblyai.com/docs/models/entity-detection) is enabled, can be true or false | [optional]
**entities** | Option<[**Vec<models::Entity>**](Entity.md)> | An array of results for the Entity Detection model, if it is enabled. See [Entity detection](https://www.assemblyai.com/docs/models/entity-detection) for more information.  | [optional]
**speech_threshold** | Option<**f32**> | Defaults to null. Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.  | [optional]
**throttled** | Option<**bool**> | True while a request is throttled and false when a request is no longer throttled | [optional]
**error** | Option<**String**> | Error message of why the transcript failed | [optional]
**language_model** | **String** | The language model that was used for the transcript | 
**acoustic_model** | **String** | The acoustic model that was used for the transcript | 
**speech_understanding** | Option<[**models::TranscriptSpeechUnderstanding**](Transcript_speech_understanding.md)> |  | [optional]
**translated_texts** | Option<[**models::TranscriptTranslatedTexts**](Transcript_translated_texts.md)> |  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


