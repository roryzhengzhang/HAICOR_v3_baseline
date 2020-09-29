// Copyright (c) 2020 HAICOR Project Team
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export default class API {
    static concept(id) {
        return `/api/concept/${id}`;
    }

    static concept_search(text, speech) {
        if (speech == '?')
            return `/api/search/${text}`;
        else
            return `/api/search/${text}/${speech}`;
    }

    static assertion(source, target) {
        return `/api/assertion/${source}/${target}`;
    }

    static assertion_search(source, middle, target) {
        return `/api/reason/${source}/${middle}/${target}`;
    }

    //fetch story narrative by id
    static fetch_story(story_id)
    {
        return `/api/story/fetch/${story_id}`;
    }

    //fetch reasoning paths the machine dependent on when making inference
    static fetch_reasoning_path(story_id, context_ids, sentence_id)
    {
        return `/api/story/paths/${story_id}/${context_ids}/${sentence_id}`;
    }

    //fetch prediction of the given story question (sentence_id, character is also needed)
    static fetch_AI_answers(story_id, character, sentence_id)
    {
        return `/api/story/predict/${story_id}/${character}/${sentence_id}`;
    }

}