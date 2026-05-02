import json

# Load both files
with open('tunisian_influencers_complete_with_demographics.json', 'r', encoding='utf-8') as f:
    demographics_data = json.load(f)

with open('tunisian_influencers.json', 'r', encoding='utf-8') as f:
    topics_data = json.load(f)

# Build a mapping from handler -> instagram_url (from second file)
handler_to_url = {}
for inf in topics_data.get('influencers', []):
    handler = inf.get('handler')
    url = inf.get('instagram_url')
    if handler and url:
        handler_to_url[handler] = url

# Process each influencer from demographics file
cleaned_influencers = []
for inf in demographics_data.get('influencers', []):
    handler = inf.get('handler')
    # Build cleaned entry with only essential fields
    cleaned = {
        'rank': inf.get('rank'),
        'nom': inf.get('nom'),
        'handler': handler,
        'followers': inf.get('followers'),
        'followers_text': inf.get('followers_text'),
        'engagement_rate': inf.get('engagement_rate'),
        'instagram_url': handler_to_url.get(handler, '')  # Add URL if found
    }
    # Add demographics only if they exist
    if 'dominating_age_group' in inf:
        cleaned['dominating_age_group'] = inf['dominating_age_group']
    if 'audience_gender' in inf:
        cleaned['audience_gender'] = inf['audience_gender']
    
    cleaned_influencers.append(cleaned)

# Create final JSON (just the array, but you can wrap it if needed)
final_output = {'influencers': cleaned_influencers}

# Save or print
with open('tunisian_influencers_enriched.json', 'w', encoding='utf-8') as f:
    json.dump(final_output, f, indent=2, ensure_ascii=False)

print(f"Processed {len(cleaned_influencers)} influencers.")
print("Saved to tunisian_influencers_enriched.json")