-- ============================================================
-- NeuBridge Content Seeding Migration
-- 30 Resource Articles + 25 Journal Prompts + 20 Encouragement Messages
-- Created: 2026-03-26
-- ============================================================


-- ============================================================
-- SECTION A: RESOURCE ARTICLES (30 articles)
-- ============================================================

INSERT INTO resource_articles (title, category, summary, content, source, created_at)
VALUES

-- -------------------------------------------------------
-- NUTRITION (10 articles)
-- -------------------------------------------------------

-- Article 1
('The MIND Diet: A Complete Guide for Caregivers', 'nutrition',
 'The MIND diet is a research-backed eating plan designed to protect brain health. Here is everything caregivers need to know to get started.',
 'The MIND diet stands for Mediterranean-DASH Intervention for Neurodegenerative Delay. It was developed in 2015 by researchers at Rush University Medical Center who combined the best brain-protective elements of two proven diets: the Mediterranean diet and the DASH diet. What makes the MIND diet special is that it was designed specifically to slow cognitive decline and reduce Alzheimer''s risk.

The diet centers on 10 brain-healthy food groups that you should include regularly. These are leafy green vegetables such as spinach, kale, and collard greens, which you should aim for at least six servings per week. Other vegetables like peppers, carrots, and broccoli should appear at least once a day. Nuts, especially walnuts and almonds, are recommended at least five times per week. Berries, particularly blueberries and strawberries, should be eaten at least twice per week. Beans and lentils are encouraged at least three times per week. Whole grains like oatmeal, brown rice, and whole wheat bread should be eaten at least three times per day. Fish, especially fatty fish like salmon, should appear at least once a week. Poultry like chicken or turkey is recommended at least twice per week. Olive oil should replace butter as your primary cooking fat. And one optional glass of red wine or grape juice per day rounds out the list.

The MIND diet also identifies five food groups to limit. Red meat should be kept to fewer than four servings per week. Butter and margarine should stay under one tablespoon per day. Cheese should be limited to less than one serving per week. Pastries and sweets should be fewer than five servings per week. Fried food and fast food should appear less than once per week.

The research behind this diet is encouraging. A study published in Alzheimer''s and Dementia found that people who followed the MIND diet closely experienced cognitive decline equivalent to being 7.5 years younger compared to those who did not. Even moderate adherence showed measurable benefits, which means that every small change matters.

As a caregiver, you do not need to overhaul your entire kitchen overnight. Start by adding one extra serving of leafy greens per day and swapping butter for olive oil. Small steps add up. The NeuBridge app tracks MIND diet adherence automatically when you log meals, giving you a simple score from 0 to 15 so you can see your progress over time.',
 'Morris et al., Alzheimer''s and Dementia, 2015; Rush University MIND Diet Research', NOW())
ON CONFLICT DO NOTHING,

-- Article 2
('10 Brain-Healthy Foods to Add This Week', 'nutrition',
 'Adding even a few brain-healthy foods to your weekly routine can make a difference. Here are ten to start with today.',
 'You do not need a complicated meal plan to start feeding the brain well. Research shows that consistently including certain foods in your diet can support cognitive health and may slow the progression of Alzheimer''s disease. Here are ten brain-healthy foods you can add to your meals this week, along with practical tips for each one.

First, leafy greens like spinach, kale, and romaine lettuce. These are rich in folate, lutein, and vitamin K, which support brain cell health. Aim for a salad or a handful of greens added to a soup or smoothie at least six times per week.

Second, blueberries. These small berries are packed with anthocyanins, powerful antioxidants that cross the blood-brain barrier and protect neurons from oxidative damage. Fresh or frozen, they work beautifully in oatmeal, yogurt, or eaten by the handful.

Third, walnuts. Shaped like tiny brains for good reason, walnuts are high in omega-3 fatty acids and polyphenols. Keep a small bowl on the kitchen counter for easy snacking.

Fourth, black beans and lentils. These affordable legumes provide protein, fiber, and folate. Add them to soups, stews, or salads several times per week.

Fifth, whole grain oatmeal. Starting the day with oatmeal gives the brain a steady supply of glucose without the spike and crash of refined carbohydrates. Top it with berries and walnuts for a triple brain boost.

Sixth, salmon. Fatty fish like salmon, sardines, and mackerel are the best dietary sources of DHA, an omega-3 fat that makes up a large portion of brain cell membranes. Aim for at least one serving per week.

Seventh, chicken or turkey. Lean poultry provides B vitamins and protein without the saturated fat found in red meat. Include it at least twice per week.

Eighth, extra virgin olive oil. Rich in polyphenols and healthy monounsaturated fats, olive oil should replace butter and vegetable oil as your go-to cooking fat. Drizzle it on salads, bread, and roasted vegetables.

Ninth, carrots, bell peppers, and other colorful vegetables. These provide beta-carotene and other antioxidants that reduce inflammation throughout the body, including the brain. Eat at least one serving daily.

Tenth, red grapes or grape juice. If your loved one enjoys a small glass of grape juice or a few red grapes, the resveratrol may offer additional brain-protective benefits.

Start with whichever foods feel easiest to add. Every brain-healthy choice counts, no matter how small.',
 'Morris et al., 2015; USDA Dietary Guidelines; Alzheimer''s Association nutrition resources', NOW())
ON CONFLICT DO NOTHING,

-- Article 3
('Why Berries Are a Brain Superfood', 'nutrition',
 'Blueberries, strawberries, and other berries contain powerful antioxidants that directly protect brain cells from damage.',
 'If there is one food group that consistently stands out in Alzheimer''s research, it is berries. Blueberries, strawberries, blackberries, and raspberries are packed with flavonoids called anthocyanins. These are the compounds that give berries their deep red, blue, and purple colors, and they are among the very few dietary antioxidants that can cross the blood-brain barrier and work directly inside the brain.

The science is compelling. The Nurses'' Health Study, one of the longest-running health studies in the United States, followed over 16,000 women for more than 20 years. Researchers found that women who ate the most blueberries and strawberries delayed cognitive aging by up to 2.5 years compared to women who rarely ate berries. That is a meaningful difference, and it came from a simple dietary change.

How do berries help the brain? Anthocyanins reduce chronic inflammation in brain tissue, which is one of the key drivers of Alzheimer''s disease. They also improve signaling between brain cells, helping neurons communicate more effectively. Some animal studies suggest that berry compounds may even help clear amyloid plaques, the protein deposits associated with Alzheimer''s, though this has not yet been confirmed in human trials.

The MIND diet recommends eating berries at least twice per week, but more is fine. Fresh berries are wonderful when they are in season, but frozen berries retain nearly all of their nutritional value and cost less. In fact, berries are often flash-frozen within hours of harvesting, which locks in their nutrients at peak freshness.

Here are easy ways to include berries in your loved one''s diet. Add a handful of blueberries to morning oatmeal or cereal. Blend strawberries and banana into a simple smoothie with milk. Serve a small bowl of mixed berries as an afternoon snack. Stir raspberries into plain yogurt with a drizzle of honey. Make a berry sauce by gently heating frozen berries in a saucepan and spooning it over pancakes or ice cream.

If your loved one has difficulty chewing whole berries, try mashing them lightly with a fork or pureeing them in a blender. Berry jam with low added sugar is another option, though whole fruit provides more fiber. Track berry consumption in the NeuBridge app when you log meals. The app will count it toward the MIND diet score automatically.',
 'Devore et al., Annals of Neurology, 2012; Morris et al., 2015; Harvard T.H. Chan School of Public Health', NOW())
ON CONFLICT DO NOTHING,

-- Article 4
('Simple Meal Planning for Alzheimer''s Caregivers', 'nutrition',
 'A weekly meal plan built around brain-healthy foods makes nutrition easier without adding stress to your caregiving routine.',
 'Meal planning can feel overwhelming when you are already managing medications, appointments, and daily care. The good news is that brain-healthy meal planning does not have to be complicated. A simple weekly framework can take the guesswork out of cooking and ensure your loved one gets the nutrients their brain needs.

Start with a three-day rotation. Instead of planning seven unique dinners, plan three and repeat them. For example, Monday and Thursday could be baked salmon with roasted vegetables and brown rice. Tuesday and Friday could be chicken stir-fry with leafy greens and whole wheat noodles. Wednesday and Saturday could be black bean soup with a side salad and whole grain bread. Sunday can be a flexible day for leftovers or a simple comfort meal.

For breakfasts, keep it consistent. Oatmeal with berries and walnuts three days a week, whole wheat toast with olive oil and scrambled eggs two days, and a fruit and yogurt smoothie on the remaining days. Consistency is actually helpful for people with Alzheimer''s because familiar foods reduce anxiety and confusion at mealtimes.

Batch cooking is your best friend. On a weekend morning, cook a large pot of brown rice or quinoa, roast a sheet pan of mixed vegetables, and prepare a big batch of bean soup. Store these in the refrigerator in clear containers so they are easy to see and grab. Most batch-cooked items stay fresh for four to five days.

Finger foods are especially useful for people in the middle and later stages of Alzheimer''s who may struggle with utensils. Cut sandwiches into strips, serve steamed broccoli florets, offer cheese cubes with whole grain crackers, or make small wraps with chicken and lettuce. Foods that are easy to pick up and eat independently help preserve your loved one''s sense of autonomy.

Keep a running grocery list on the refrigerator organized by the MIND diet food groups. Each week, check that you have leafy greens, berries, nuts, beans, whole grains, fish, poultry, olive oil, and at least two other vegetables. Shopping with a list saves time, reduces waste, and ensures nothing important gets forgotten.',
 'NeuBridge nutrition team; Alzheimer''s Association caregiver resources', NOW())
ON CONFLICT DO NOTHING,

-- Article 5
('What to Do When Your Loved One Refuses to Eat', 'nutrition',
 'Mealtime refusal is common in Alzheimer''s disease. These gentle strategies can help without creating conflict.',
 'Refusing food is one of the most stressful challenges caregivers face, and it is also one of the most common. Research suggests that up to 40 percent of people with moderate to severe Alzheimer''s experience significant changes in appetite, food preferences, or willingness to eat. Understanding why this happens is the first step toward finding solutions that work.

There are many possible reasons a person with Alzheimer''s may refuse food. They may not recognize what is on the plate, especially if the presentation looks different from what they are used to. They may struggle with utensils and feel frustrated or embarrassed. Changes in taste and smell can make previously favorite foods seem unappealing or even unpleasant. Some medications reduce appetite as a side effect. Dental pain, ill-fitting dentures, or mouth sores can make chewing painful. And in later stages, the brain may simply lose the ability to signal hunger.

Here are gentle strategies that experienced caregivers and clinical teams recommend. First, serve familiar comfort foods. This is not the time to experiment with new recipes. Think about what your loved one has enjoyed eating for decades and build meals around those flavors and textures.

Second, simplify the plate. One or two items at a time is much less overwhelming than a full plate with multiple dishes. You can always offer a second course after the first is finished.

Third, use contrasting colors. A white plate on a white tablecloth makes food hard to see. Use a colored plate or placemat so the food stands out visually. Research shows that red plates can increase food intake by up to 25 percent in people with dementia.

Fourth, eat together. People with Alzheimer''s are more likely to eat when they see someone else eating the same food at the same table. Your presence and your example provide important social cues.

Fifth, offer finger foods. Chicken strips, steamed vegetable pieces, small sandwiches, fruit slices, and cheese cubes are all easy to pick up and eat without utensils.

Sixth, try smaller, more frequent meals. If three large meals feel like too much, offer five or six smaller snacks throughout the day. Track what your loved one eats in the NeuBridge app so you can spot patterns and share them with their doctor. Consistent weight loss or refusal lasting more than a few days is worth a medical conversation.',
 'Alzheimer''s Association; Kai et al., International Journal of Geriatric Psychiatry, 2020', NOW())
ON CONFLICT DO NOTHING,

-- Article 6
('Brain-Healthy Snacks That Are Easy to Prepare', 'nutrition',
 'Nutritious snacks can boost brain health between meals. These simple options take five minutes or less to prepare.',
 'Snacking gets a bad reputation, but for people with Alzheimer''s disease, well-chosen snacks can be an important source of brain-healthy nutrients. Many people with dementia eat less at main meals, so snacks help fill nutritional gaps and keep energy levels steady throughout the day. The key is to choose snacks that are easy to prepare, easy to eat, and aligned with the MIND diet.

Trail mix with walnuts and dark chocolate is one of the easiest brain-healthy snacks you can make. Combine a cup of walnuts, a cup of almonds, half a cup of dark chocolate chips, and half a cup of dried cranberries or raisins. Store it in a jar on the counter where your loved one can see it. Walnuts are rich in omega-3 fatty acids, and dark chocolate contains flavonoids that support blood flow to the brain.

A berry smoothie takes about two minutes in a blender. Combine a cup of frozen mixed berries, half a cup of plain yogurt, half a cup of milk, and a tablespoon of ground flaxseed. This provides anthocyanins from the berries, protein from the yogurt, and additional omega-3s from the flax.

Apple slices with almond butter are a satisfying combination of fiber, healthy fat, and natural sweetness. Slice an apple and serve it with two tablespoons of almond butter for dipping. If your loved one has difficulty with hard apple slices, try softer pear slices instead.

Hummus with whole grain crackers or carrot sticks provides protein, fiber, and healthy fats from the chickpeas and olive oil in the hummus. Buy it premade or blend a can of chickpeas with olive oil, lemon juice, and garlic in under five minutes.

Yogurt parfaits are another quick option. Layer plain Greek yogurt with a handful of blueberries and a sprinkle of granola or chopped walnuts. Greek yogurt is higher in protein than regular yogurt, which helps maintain muscle mass.

Cheese and whole grain crackers are a simple finger food that most people enjoy. Choose a small portion of cheese paired with whole grain crackers for a satisfying snack.

Hard-boiled eggs are easy to prepare in batches and store in the refrigerator for up to a week. They provide protein and choline, a nutrient important for brain function. Keep snacks visible and within reach. People with Alzheimer''s often eat what they can see, so placing a bowl of trail mix or a plate of fruit on the kitchen table can naturally encourage healthy snacking throughout the day.',
 'NeuBridge nutrition team; MIND diet snacking guidelines', NOW())
ON CONFLICT DO NOTHING,

-- Article 7
('The Power of Olive Oil for Brain Health', 'nutrition',
 'Extra virgin olive oil is a cornerstone of the MIND diet. Its polyphenols and healthy fats offer real protection for the aging brain.',
 'Extra virgin olive oil has been a staple of Mediterranean cooking for thousands of years, and modern science is revealing exactly why it is so good for the brain. The MIND diet lists olive oil as one of its ten essential food groups and recommends using it as your primary cooking fat in place of butter, margarine, and vegetable oils.

What makes olive oil special is its combination of monounsaturated fats and polyphenols. Monounsaturated fats help maintain the integrity of brain cell membranes, keeping them flexible and functional. Polyphenols, particularly a compound called oleocanthal, have powerful anti-inflammatory properties. Chronic brain inflammation is one of the major drivers of Alzheimer''s disease, and oleocanthal has been shown in laboratory studies to help reduce the buildup of amyloid-beta plaques, the protein deposits associated with Alzheimer''s.

A landmark study published in the Journal of Alzheimer''s Disease followed over 6,000 older adults and found that those who regularly consumed olive oil had a 28 percent lower risk of dying from dementia compared to those who rarely or never used it. Another study from the PREDIMED trial found that participants who supplemented their diet with extra virgin olive oil performed significantly better on cognitive tests than those in the control group.

For caregivers, incorporating olive oil into daily cooking is straightforward. Use it to saute vegetables instead of butter. Drizzle it over salads as a simple dressing with a squeeze of lemon. Toss cooked pasta or rice with a tablespoon of olive oil and herbs. Brush it on whole grain bread instead of spreading butter. Roast vegetables in the oven with a light coating of olive oil, salt, and pepper.

When shopping, look for bottles labeled extra virgin, which means the oil was cold-pressed without chemicals and retains the highest level of polyphenols. Store it in a cool, dark place because light and heat degrade the beneficial compounds. A dark glass bottle is better than a clear one.

How much should you use? There is no strict daily amount, but two to three tablespoons per day is a common recommendation in Mediterranean diet research. At roughly 120 calories per tablespoon, it is calorie-dense, so it also helps when you need to boost caloric intake for a loved one who is losing weight. Every time you reach for olive oil instead of butter, you are making a choice that supports brain health.',
 'Berr et al., Journal of Alzheimer''s Disease, 2009; PREDIMED Study; Harvard Health Publishing', NOW())
ON CONFLICT DO NOTHING,

-- Article 8
('Fish and Brain Health: What the Science Says', 'nutrition',
 'Fatty fish like salmon and sardines are rich in omega-3 fatty acids that the brain needs to stay healthy. Here is what the research shows.',
 'The human brain is nearly 60 percent fat, and a significant portion of that fat is an omega-3 fatty acid called DHA, or docosahexaenoic acid. DHA is essential for maintaining the structure and function of brain cell membranes, and the best dietary source of DHA is fatty fish. This is why the MIND diet recommends eating fish at least once per week.

The research on fish and brain health is robust. The Framingham Heart Study found that people with the highest blood levels of DHA had a 47 percent lower risk of developing dementia compared to those with the lowest levels. A large meta-analysis published in the Journal of Alzheimer''s Disease reviewed 21 studies and concluded that eating fish once or more per week was associated with a significantly reduced risk of Alzheimer''s and cognitive decline.

Which fish are best? The highest omega-3 content is found in fatty fish like salmon, mackerel, sardines, herring, and trout. A single four-ounce serving of wild salmon provides about 1,500 milligrams of omega-3s, which is well above the 250 to 500 milligrams recommended daily by most health organizations.

For caregivers, the practical goal is simple: serve fish at least once per week. Baked salmon with lemon and herbs is a crowd-pleaser. Canned sardines on whole grain crackers make a quick lunch. Canned tuna mixed with olive oil and served on a bed of greens is another easy option. Fish tacos with a cabbage slaw can make fish feel fun and approachable.

If your loved one does not like fish or is allergic, there are alternatives. Walnuts, flaxseed, and chia seeds contain ALA, a plant-based omega-3 that the body can partially convert to DHA. While the conversion rate is low, these foods still provide brain benefits. Fortified eggs, which come from hens fed flaxseed, contain small amounts of DHA. Fish oil supplements are another option, but talk to your loved one''s doctor before starting any supplement, especially if they take blood-thinning medications.

When buying fish, fresh or frozen are both excellent choices. Canned fish like salmon and sardines are affordable, shelf-stable, and retain their omega-3 content. Avoid fish that is battered and deep-fried, as the frying process adds unhealthy fats and reduces the omega-3 benefit. Track fish servings in the NeuBridge app to make sure this brain-healthy food shows up on the plate regularly.',
 'Schaefer et al., Framingham Heart Study; Zhang et al., Journal of Alzheimer''s Disease, 2016; American Heart Association', NOW())
ON CONFLICT DO NOTHING,

-- Article 9
('When Your Loved One Forgets to Eat', 'nutrition',
 'Forgetting meals is a common challenge in Alzheimer''s. These strategies help ensure your loved one stays nourished throughout the day.',
 'As Alzheimer''s disease progresses, many people gradually lose the ability to recognize hunger or remember when they last ate. This is different from refusing food. Your loved one may not be choosing to skip meals. They may simply forget that it is mealtime or lose track of whether they have eaten already. Understanding this distinction helps caregivers approach the problem with compassion rather than frustration.

Forgetting to eat can lead to serious health consequences including weight loss, malnutrition, muscle weakness, increased confusion, and a weakened immune system. Dehydration often accompanies missed meals, compounding the problem. The good news is that with a few thoughtful strategies, you can help ensure your loved one stays properly nourished.

Set a consistent meal schedule and stick to it. Serve breakfast, lunch, and dinner at the same times every day. The brain responds to routine even when memory is impaired, and a predictable schedule helps the body anticipate mealtimes. Write the meal schedule on a whiteboard in the kitchen or set alarms as gentle reminders.

Make food visible. Place a bowl of fruit on the kitchen table, keep snacks at eye level in the refrigerator, and leave a covered plate of food in a spot where your loved one spends time. People with Alzheimer''s are much more likely to eat when food is within their line of sight. Out of sight often means out of mind, literally.

Eat together whenever possible. Sharing a meal provides social cues that prompt eating behavior. When your loved one sees you picking up a fork and taking a bite, it activates the brain''s mirroring response. This is especially helpful in the middle stages of the disease when verbal prompts may not always register.

Use visual cues beyond just the food itself. Set the table with a placemat, napkin, and utensils even for snacks. The visual context of a set table signals to the brain that it is time to eat. Some caregivers find that playing familiar mealtime music or cooking aromatic foods helps trigger appetite and memory.

Keep a simple log of what your loved one eats each day. The NeuBridge app makes this easy with its meal logging feature. Over time, you will notice patterns. Maybe your loved one eats better in the morning. Maybe they respond well to certain smells or textures. These insights help you adjust your approach and share meaningful data with the care team.

If your loved one consistently misses meals despite your best efforts, talk to their doctor. A nutritionist who specializes in dementia care can provide personalized guidance, and there may be medical interventions that can help.',
 'Alzheimer''s Association; National Institute on Aging; NeuBridge care team guidance', NOW())
ON CONFLICT DO NOTHING,

-- Article 10
('Understanding Weight Loss in Alzheimer''s', 'nutrition',
 'Unintentional weight loss is common in Alzheimer''s disease and can signal important health changes. Here is what caregivers should know.',
 'Unintentional weight loss affects a significant number of people living with Alzheimer''s disease. Studies suggest that up to 40 percent of people with Alzheimer''s experience meaningful weight loss during the course of the illness, and in some cases, weight loss begins years before a diagnosis is made. Understanding why this happens and what you can do about it is an important part of caregiving.

There are several reasons weight loss occurs in Alzheimer''s. First, people may simply forget to eat as the disease affects memory and the ability to recognize hunger signals. Second, changes in taste and smell can make food less appealing. Third, the physical act of eating becomes more difficult as the disease progresses. Chewing and swallowing may require more effort, and using utensils can become frustrating. Fourth, increased agitation, wandering, and restlessness in the middle stages of the disease burn more calories. Fifth, some Alzheimer''s medications can reduce appetite as a side effect.

Weight loss matters because it is associated with faster cognitive decline, increased risk of infections, slower wound healing, loss of muscle mass, and reduced quality of life. Even modest weight loss of five percent or more over six months should be discussed with your loved one''s doctor.

Here are practical strategies to help maintain a healthy weight. Offer calorie-dense foods that pack nutrition into smaller portions. Avocados, nut butters, olive oil, cheese, and full-fat yogurt are all good options. Add a tablespoon of olive oil to soups, pasta, or mashed potatoes for an extra 120 calories that does not change the flavor significantly. Use whole milk instead of skim in cooking and beverages.

Serve smaller, more frequent meals. Five or six small meals and snacks throughout the day may be easier to manage than three large meals. Keep calorie-rich snacks like trail mix, cheese and crackers, or peanut butter on toast within easy reach.

Track your loved one''s weight regularly. Weigh them at the same time of day, in the same clothing, once per week. Record the weight in the NeuBridge app so you can spot trends early and share the data with their healthcare provider.

If weight loss continues despite your best efforts, ask the doctor about a referral to a registered dietitian who specializes in geriatric or dementia care. In some cases, nutritional supplements like meal replacement shakes can help bridge the gap. The important thing is to catch weight loss early and respond proactively rather than waiting until it becomes severe.',
 'White et al., Journal of the American Geriatrics Society; Alzheimer''s Association; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- -------------------------------------------------------
-- HYDRATION (5 articles)
-- -------------------------------------------------------

-- Article 11
('The Hidden Danger of Dehydration in Dementia', 'hydration',
 'People with dementia are at high risk for dehydration because they often forget to drink. The consequences can be serious and easily mistaken for worsening dementia.',
 'Dehydration is one of the most common yet overlooked health risks for people living with dementia. Studies estimate that up to 40 percent of older adults in care settings are chronically under-hydrated, and the risk is even higher for people with Alzheimer''s disease. The reason is straightforward: as the disease damages brain regions responsible for recognizing thirst and remembering daily habits, many people simply stop drinking enough fluids.

The consequences of dehydration go far beyond feeling thirsty. In people with Alzheimer''s, dehydration can cause sudden increases in confusion, agitation, and disorientation that look almost identical to a worsening of the disease itself. Many caregivers and even some healthcare providers mistake dehydration-related confusion for disease progression, which means the real problem goes untreated. Once fluids are restored, cognitive function often improves noticeably within hours.

Beyond confusion, dehydration increases the risk of urinary tract infections, which are another common cause of sudden behavioral changes in people with dementia. It can also cause constipation, low blood pressure, dizziness, falls, and kidney problems. In severe cases, dehydration requires hospitalization.

The general recommendation is that older adults drink six to eight cups of fluid per day, though individual needs vary based on body size, activity level, medications, and climate. Water is the best choice, but other fluids count too. Herbal tea, diluted fruit juice, milk, broth, and water-rich foods like watermelon, cucumber, and soup all contribute to hydration.

Prevention starts with making fluids visible and accessible at all times. Keep a filled water glass or cup within arm''s reach wherever your loved one spends time. Use a clear glass so they can see the water inside. Offer a drink with every meal and snack, and between meals as well.

Establish a hydration schedule. Rather than relying on your loved one to ask for a drink, offer fluids at regular intervals throughout the day. Every two hours is a good starting point. The NeuBridge app includes hydration tracking and reminders that can help you stay on schedule.

Pay attention to environmental factors. Hot weather, heated indoor air, and physical activity all increase fluid needs. If your loved one takes diuretic medications, they may need extra fluids to compensate. Talk to their doctor about how much fluid is right for their specific situation.',
 'Alzheimer''s Society UK; Hooper et al., Age and Ageing, 2015; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- Article 12
('Creative Ways to Keep Your Loved One Hydrated', 'hydration',
 'When plain water is not appealing, these creative strategies can help your loved one get the fluids they need.',
 'Getting a person with Alzheimer''s to drink enough fluids can be a daily challenge. They may not feel thirsty, may forget to drink, or may simply find plain water unappealing. The good news is that hydration does not have to come only from a glass of water. There are many creative and enjoyable ways to increase fluid intake throughout the day.

Flavored water is one of the easiest approaches. Add slices of lemon, lime, cucumber, or orange to a pitcher of water and keep it in the refrigerator. A few fresh mint leaves or a handful of berries can also make water more visually appealing and flavorful. Some people respond well to the sight of colorful fruit floating in a clear pitcher. You can also try sparkling water with a splash of fruit juice for variety.

Homemade popsicles are a wonderful option, especially in warmer weather. Blend fruit juice with small pieces of real fruit and freeze the mixture in popsicle molds. You can also freeze yogurt smoothies for a creamy, protein-rich frozen treat. Popsicles feel like a snack rather than a medical intervention, which makes them more appealing.

Soups and broths are hydrating and nourishing at the same time. A warm cup of chicken broth or vegetable soup provides fluids along with electrolytes and nutrients. Many people with Alzheimer''s find warm liquids comforting, and the familiar smell of soup can stimulate appetite and the desire to drink.

Water-rich fruits and vegetables count toward daily fluid intake. Watermelon is over 90 percent water and most people find it delicious. Cucumber, grapes, oranges, strawberries, and celery are also excellent choices. Serve them sliced and ready to eat at snack time.

Gelatin desserts like flavored gelatin are another way to sneak in fluids. They are easy to swallow, come in appealing colors, and feel like a treat. You can make them with fruit juice instead of water for added nutrition.

Herbal teas served warm or iced can be soothing and hydrating. Chamomile, peppermint, and ginger teas are naturally caffeine-free and gentle on the stomach. Serve them in a favorite mug to make the experience feel familiar and comforting.

A companion sipping strategy works well for many caregivers. When you pour yourself a drink, pour one for your loved one too. When they see you drinking, they are more likely to pick up their own glass. Make drinking a social activity rather than a task. The NeuBridge app can send gentle hydration reminders through the companion pet, making the prompt feel warm and personal rather than clinical.',
 'NeuBridge care team; British Nutrition Foundation; Alzheimer''s Association', NOW())
ON CONFLICT DO NOTHING,

-- Article 13
('How to Spot Dehydration in Someone with Dementia', 'hydration',
 'Recognizing dehydration early can prevent serious complications. Here are the signs every caregiver should know.',
 'Dehydration in people with Alzheimer''s disease can develop quickly and quietly. Because your loved one may not be able to tell you they feel thirsty or unwell, it is important for caregivers to recognize the physical signs of dehydration before it becomes a medical emergency. Knowing what to look for can make the difference between a simple glass of water and a trip to the emergency room.

The most reliable early signs of dehydration include dark yellow or amber-colored urine. Healthy, well-hydrated urine should be pale yellow or straw-colored. If you notice that your loved one''s urine is consistently dark, they are likely not drinking enough. Reduced urine output or infrequent trips to the bathroom is another red flag.

Dry mouth and cracked lips are visible signs you can check easily. Gently look at your loved one''s lips and the inside of their mouth. If the mouth looks dry, the tongue is coated, or the lips are cracked and peeling, dehydration may be developing.

The skin turgor test is a simple check you can do at home. Gently pinch the skin on the back of the hand or forearm and then release it. In a well-hydrated person, the skin snaps back into place immediately. In a dehydrated person, the skin remains tented or returns to normal very slowly. While this test is less reliable in very elderly people whose skin has lost elasticity, a significant delay in skin rebound is still a useful indicator.

Sudden increases in confusion, agitation, or irritability can be caused by dehydration. If your loved one seems noticeably more confused than usual or becomes agitated without an obvious trigger, consider whether they have been drinking enough. Offer fluids and observe whether their mental state improves over the next few hours.

Other signs to watch for include headache, dizziness when standing up, fatigue or unusual sleepiness, constipation, rapid heart rate, and sunken-looking eyes. In more severe cases, dehydration can cause fever, very low blood pressure, and loss of consciousness, which require immediate medical attention.

Keep a daily hydration log using the NeuBridge app. Recording fluid intake helps you spot patterns and identify days when your loved one is drinking significantly less than usual. If you notice two or more signs of dehydration at the same time, increase fluid intake immediately and contact your loved one''s doctor if symptoms do not improve within a few hours. Prevention is always easier than treatment, so aim to offer fluids proactively every two hours rather than waiting for signs of trouble.',
 'Hooper et al., Age and Ageing, 2015; Mayo Clinic; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- Article 14
('The Best Drinks for Someone with Alzheimer''s', 'hydration',
 'Not all beverages are created equal. Here are the best and worst drink choices for someone living with Alzheimer''s disease.',
 'Choosing the right beverages for someone with Alzheimer''s disease matters more than you might think. The right drinks support hydration, brain health, and overall wellbeing. The wrong ones can increase agitation, disrupt sleep, or cause other problems. Here is a practical guide to the best and worst beverage choices for your loved one.

Water is always the best foundation for hydration. It has no calories, no sugar, and no additives. The challenge is that many people with Alzheimer''s find plain water boring or simply forget to drink it. Using a familiar cup, keeping water visible, and adding a slice of fruit can all help. Aim for six to eight cups of total fluids per day, with water making up the majority.

Herbal tea is an excellent choice. Chamomile tea is naturally calming and can be especially helpful in the afternoon and evening when sundowning is a concern. Peppermint tea aids digestion and has a pleasant, familiar flavor. Ginger tea can help with nausea. Serve herbal tea warm or chilled depending on preference and season. Avoid adding too much sugar.

Milk provides hydration along with calcium, protein, and vitamin D, all of which are important for older adults. Whole milk is a good choice for people who need extra calories. If your loved one is lactose intolerant, fortified oat milk or almond milk are reasonable alternatives.

Diluted fruit juice can add variety and appeal. Pure fruit juice contains natural sugars and vitamins, but it is concentrated. Dilute it with an equal amount of water to reduce the sugar load while keeping the flavor. Apple juice, grape juice, and cranberry juice are popular options.

Smoothies are a powerhouse option that combines hydration with nutrition. Blend berries, banana, yogurt, and milk for a drink that provides antioxidants, protein, calcium, and fluids all in one glass. You can even add a handful of spinach without significantly changing the flavor.

Broth and soup count as fluids too. Warm chicken or vegetable broth is soothing, hydrating, and provides electrolytes like sodium and potassium that help the body retain fluids.

Beverages to limit or avoid include caffeinated coffee and tea, which can increase agitation and disrupt sleep if consumed in the afternoon. Sugary sodas and energy drinks provide empty calories and can cause blood sugar spikes. Alcohol should generally be avoided unless specifically approved by the doctor, as it can interact with Alzheimer''s medications and worsen confusion. Very hot beverages should be served at a safe temperature to prevent burns, as your loved one may not recognize when something is too hot to drink.',
 'Alzheimer''s Association; British Dietetic Association; NeuBridge care team', NOW())
ON CONFLICT DO NOTHING,

-- Article 15
('Building a Hydration Routine That Works', 'hydration',
 'A consistent hydration routine removes the guesswork and helps ensure your loved one drinks enough every day.',
 'Relying on a person with Alzheimer''s to remember to drink is not a realistic strategy. As the disease progresses, the brain''s thirst mechanism weakens and the ability to form new habits diminishes. That is why building a structured hydration routine is one of the most important things a caregiver can do. A good routine is simple, consistent, and woven into the rhythm of the day so that it feels natural rather than forced.

Start by choosing a dedicated cup or water bottle that your loved one uses every day. Familiarity matters enormously in Alzheimer''s care. A cup they have used for years, or one in their favorite color, is more likely to be picked up than an unfamiliar one. Some caregivers find that a clear cup works best because the liquid inside serves as a visual reminder. Others prefer a cup with a lid and straw to reduce spills. Whatever you choose, keep it consistent.

Build hydration into the daily schedule at predictable times. A good framework might look like this: a glass of water first thing in the morning upon waking, a cup of herbal tea with breakfast, a glass of water mid-morning, a glass of juice diluted with water at lunch, a cup of water mid-afternoon, a cup of broth or tea with dinner, and a final small glass of water in the early evening. That adds up to about seven cups of fluid, which meets the daily target for most older adults. Reduce fluids in the two hours before bedtime to minimize nighttime bathroom trips.

Use environmental cues to support the routine. Place a filled cup in every room where your loved one spends time. If they sit in a favorite chair to watch television, put a cup on the side table before they sit down. If they spend time in the kitchen, keep a pitcher of water on the counter at eye level.

Pair drinking with other activities. When it is time for medication, include a full glass of water. Before a walk, offer a drink. After an activity with the companion pet in the NeuBridge app, the pet can prompt a hydration break. These associations help anchor the habit.

Track fluid intake each day. The NeuBridge app makes this simple with its hydration logging feature. Over time, you will be able to see whether your loved one is meeting their daily target and identify days or times when they tend to drink less. Share this data with the care team at medical appointments. A hydration routine does not have to be complicated, but it does need to be consistent. Once you establish it, it becomes second nature for both you and your loved one.',
 'NeuBridge care team; Alzheimer''s Society UK; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- -------------------------------------------------------
-- COMPANION THERAPY (5 articles)
-- -------------------------------------------------------

-- Article 16
('The Science Behind Pet Therapy for Dementia', 'companion_therapy',
 'Research shows that interacting with companion animals, both real and robotic, can reduce anxiety and agitation in people with dementia.',
 'Pet therapy for dementia is not a new idea, but in recent years the scientific evidence behind it has grown substantially. Researchers have found that interacting with a companion animal, whether real, robotic, or virtual, can produce measurable improvements in mood, behavior, and quality of life for people living with Alzheimer''s disease and other forms of dementia.

One of the most studied robotic companions is PARO, a therapeutic robot designed to look like a baby harp seal. Developed in Japan, PARO has been the subject of dozens of clinical trials around the world. A systematic review published in the Journal of the American Medical Directors Association found that PARO therapy significantly reduced agitation, anxiety, and depression in people with dementia. Participants who interacted with PARO showed lower levels of cortisol, the body''s primary stress hormone, and higher levels of oxytocin, sometimes called the bonding hormone.

Joy for All companion pets, which are realistic-looking cats and dogs made by Ageless Innovation, have also been studied in care settings. A study conducted at the University of Texas found that residents with dementia who received Joy for All pets showed reduced expressions of anxiety and improved social interaction compared to a control group. The pets purr, move their heads, and respond to touch, providing a sense of companionship without the demands of caring for a real animal.

The science behind these benefits is rooted in how the brain processes social connection. When a person pets an animal or holds a warm, responsive companion, the brain releases oxytocin and serotonin while reducing cortisol and adrenaline. These chemical changes create a sense of calm and safety. Importantly, these neurochemical responses remain intact even in advanced dementia, long after verbal communication and complex reasoning have declined.

Virtual companions, like the NeuBridge companion pet, build on this same foundation. They offer consistent, always-available interaction without the logistical challenges of real animals. There are no feeding schedules, no vet visits, no allergy concerns, and no infection risks. The virtual pet is always in a good mood and always happy to see the patient.

For caregivers, companion therapy offers an additional benefit: it can provide a few minutes of calm engagement that allows you to step away briefly, take a breath, or attend to another task, knowing that your loved one is interacting with something comforting and safe. The evidence supports what many caregivers discover intuitively: that the simple presence of a gentle companion, whether it has fur or pixels, can make a hard day a little easier.',
 'Petersen et al., JAMDA, 2017; Ageless Innovation research; Wada and Shibata, PARO clinical trials', NOW())
ON CONFLICT DO NOTHING,

-- Article 17
('How Virtual Companions Reduce Anxiety', 'companion_therapy',
 'Digital and virtual companion pets provide consistent, calming interaction that can significantly reduce anxiety in people with dementia.',
 'Anxiety is one of the most common and distressing symptoms of Alzheimer''s disease. It can manifest as restlessness, repetitive questioning, pacing, agitation, or a pervasive sense of unease. For caregivers, watching a loved one struggle with anxiety is heartbreaking, especially when verbal reassurance does not seem to help. Virtual companion pets offer a different kind of comfort, one that works through sensory engagement and emotional presence rather than words.

Virtual companions work by providing what psychologists call a secure base. This is the same concept that explains why children feel safer with a favorite stuffed animal or blanket. The companion is always there, always predictable, always comforting. For a person with Alzheimer''s whose world feels increasingly unfamiliar and confusing, this consistency is profoundly reassuring.

Research on digital pet therapy is still emerging, but early studies are promising. A pilot study at the University of Melbourne found that older adults who interacted with a digital companion showed reduced self-reported anxiety and improved engagement compared to a control group. The key factor was the responsiveness of the companion. When the digital pet reacted to the user''s actions with visible happiness and warmth, it created a feedback loop that encouraged continued interaction.

One of the unique advantages of a virtual companion over a real animal is consistency. A real dog might be excited one day and tired the next. It might bark unexpectedly or pull away when someone reaches out. These unpredictable behaviors, while normal for an animal, can be startling or confusing for someone with dementia. A virtual companion like the NeuBridge pet never has a bad day. It is always calm, always happy to interact, and always responsive in gentle, predictable ways.

Virtual companions also offer anxiety relief through routine and structure. Interacting with the pet can become part of the daily schedule: a morning greeting, a midday play session, and an evening goodnight. These touchpoints create a sense of order and purpose in the day. For many people with Alzheimer''s, knowing what comes next reduces anxiety significantly.

The NeuBridge companion pet is designed with these principles in mind. It responds to interaction with warm, encouraging messages. It never shows distress or sadness, which avoids the risk of emotional mirroring that can occur with real animals. If the patient is having a bad day, the pet remains a steady, positive presence, offering comfort without adding emotional complexity. Over time, many patients develop a genuine attachment to their virtual companion, and that bond becomes a reliable source of calm in an otherwise uncertain world.',
 'University of Melbourne digital companion study; Alzheimer''s Association behavioral symptom guidelines; NeuBridge clinical design team', NOW())
ON CONFLICT DO NOTHING,

-- Article 18
('Virtual Pets vs Real Pets: A Caregiver''s Guide', 'companion_therapy',
 'Both virtual and real pets offer companionship benefits. Here is an honest comparison to help you decide what is best for your loved one.',
 'The question of whether to get a real pet or use a virtual companion for a loved one with Alzheimer''s is one that many caregivers wrestle with. Both options have genuine benefits, and the right choice depends on your family''s circumstances, your loved one''s stage of disease, and practical considerations. Here is an honest comparison.

Real pets offer warmth, physical texture, and a living presence that is hard to replicate. The feeling of a cat purring on your lap or a dog resting its head on your knee creates a powerful sensory experience. Real animals have been shown to lower blood pressure, reduce cortisol levels, and increase social interaction. For people in the early stages of Alzheimer''s who can still participate in an animal''s care, a real pet can provide purpose and routine.

However, real pets also come with significant responsibilities. They need to be fed, walked, groomed, and taken to the veterinarian. As Alzheimer''s progresses, your loved one will not be able to manage these tasks, which means they fall to you, the caregiver, who is already carrying a heavy load. There are also practical risks. Dogs can trip a person who is unsteady on their feet. Cats can scratch. Pets can trigger allergies or carry infections. In care facilities, live animals raise liability and hygiene concerns.

Virtual companions like the NeuBridge pet eliminate these logistical challenges while preserving many of the emotional benefits. There are no feeding schedules, no vet bills, no cleanup, and no allergy risks. The virtual pet is available around the clock and never needs a walk in the rain. It cannot scratch, bite, or cause a fall. For caregivers who are already stretched thin, this simplicity matters.

Virtual companions also offer a key advantage in consistency. The NeuBridge pet is always in a good mood and always ready to interact. It responds to your loved one with the same gentle warmth every time. This predictability is particularly valuable in the middle and late stages of Alzheimer''s, when unexpected stimuli can cause distress.

On the other hand, virtual companions cannot replicate the physical warmth and weight of a real animal. Some people with dementia may not engage with a screen-based companion as readily as they would with a living creature. Familiarity matters. If your loved one has been a lifelong animal lover, a real pet might resonate more deeply.

Many families find that the best approach is a combination. A virtual companion provides daily, reliable interaction, while occasional visits from a therapy dog or a neighbor''s gentle cat add the sensory richness of a real animal. There is no single right answer, and you know your loved one best. Whatever you choose, the goal is the same: to bring comfort, reduce anxiety, and create moments of genuine connection.',
 'Alzheimer''s Association; Ageless Innovation; NeuBridge clinical design team', NOW())
ON CONFLICT DO NOTHING,

-- Article 19
('Introducing the Companion Pet to Your Loved One', 'companion_therapy',
 'The first interaction with a companion pet sets the tone. Here is how to make the introduction smooth, comfortable, and successful.',
 'Introducing a virtual companion pet to someone with Alzheimer''s disease is a moment that deserves thoughtfulness and care. The way you present the companion can make the difference between enthusiastic engagement and confused indifference. A successful introduction creates a foundation for a relationship that will provide comfort and joy for months and years to come.

Choose a calm, quiet time for the introduction. Avoid moments when your loved one is tired, hungry, agitated, or overstimulated. Late morning or early afternoon, after a meal and before any sundowning tendencies begin, is often ideal. Turn off the television and minimize background noise so the focus can be on the pet.

Present the companion with warmth and excitement, but not too much. A gentle introduction works best. You might say something like, ''Look who came to visit you today. This little friend is here just for you.'' Use a warm, conversational tone rather than a clinical one. Never say, ''This is a therapy tool'' or ''The doctor recommended this.'' Instead, treat it like introducing a new friend.

Name the pet together. Giving the companion a name is one of the most powerful steps in building attachment. Ask your loved one what they would like to call it. If they cannot choose, suggest a name or two and let them pick. If your loved one had a beloved pet in the past, using that name can trigger positive memories and create an instant emotional connection. The NeuBridge app lets you set the pet''s name so that all messages and interactions use it consistently.

Let your loved one explore the interaction at their own pace. Show them how the pet responds when they interact with it. Point out the pet''s happy expressions and gentle movements. Some people take to the companion immediately, while others need several sessions before they warm up. Both responses are perfectly normal.

Make the companion part of the daily routine. After the initial introduction, integrate pet interactions into the existing schedule. A morning greeting with the pet, a midday play session, and a goodnight interaction create structure and give your loved one something to look forward to. Consistency builds familiarity, and familiarity builds comfort.

Watch for your loved one''s response and adjust accordingly. Some people prefer longer, quieter interactions. Others enjoy short, playful bursts. If your loved one seems disinterested at first, do not force it. Try again later or the next day. Sometimes it takes three or four attempts before the connection clicks. Once it does, you will likely see your loved one reaching for the pet on their own, and that is when you know the bond has formed.',
 'NeuBridge clinical design team; Joy for All companion introduction guidelines; Alzheimer''s Society UK', NOW())
ON CONFLICT DO NOTHING,

-- Article 20
('Why the NeuBridge Pet Is Never Sad', 'companion_therapy',
 'The NeuBridge companion pet is designed to always be positive and calm. Here is the clinical reasoning behind that intentional choice.',
 'If you have spent time with the NeuBridge companion pet, you may have noticed something specific about its design: it is never sad, never upset, and never in a bad mood. This is not a limitation or an oversight. It is a deliberate clinical decision based on how Alzheimer''s disease affects emotional processing and the documented risks of emotional mirroring in dementia care.

People with Alzheimer''s disease retain the ability to perceive and respond to emotions long after other cognitive abilities have declined. Research published in the Proceedings of the National Academy of Sciences found that emotional memories and emotional responses remain relatively preserved even in advanced stages of the disease. A person who can no longer remember what they ate for breakfast can still feel the warmth of a smile or the distress of a frown.

This preserved emotional sensitivity means that if a companion pet displayed sadness, worry, or distress, a person with Alzheimer''s could absorb those emotions without understanding why they suddenly feel upset. This phenomenon, called emotional contagion, is well-documented in dementia care research. A study published in the journal Emotion found that people with Alzheimer''s who were exposed to sad stimuli experienced prolonged negative mood states that lasted well beyond the exposure, even after they had forgotten what caused the sadness.

The clinical implications are clear. A companion pet that can appear sad creates a risk of triggering distress in the patient without providing any compensating benefit. If the pet looks sad because the patient has not visited in a while, the patient may feel guilty or anxious without understanding why. If the pet reacts negatively to a wrong answer in an activity, it could discourage future engagement. These outcomes run directly counter to the therapeutic goals of companionship.

The NeuBridge pet is mood-responsive in a different way. It recognizes the patient''s emotional state through interaction patterns and adjusts its behavior to be soothing when the patient seems anxious or celebratory when the patient seems happy. But it never mirrors negative emotions back. It is a steady, warm, positive presence at all times.

Think of it like a therapy dog that has been trained to remain calm and gentle no matter what is happening around it. The best therapy animals do not react to a patient''s distress with their own distress. They offer a grounding, reassuring presence. The NeuBridge pet follows the same principle, digitally.

This design choice also benefits caregivers. You never have to worry about the pet adding emotional complexity to an already difficult day. It will not make your loved one sad. It will not create guilt. It simply offers warmth, encouragement, and companionship, every single time.',
 'Guzman-Velez et al., PNAS, 2014; Feinstein et al., Emotion, 2010; NeuBridge clinical design team', NOW())
ON CONFLICT DO NOTHING,

-- -------------------------------------------------------
-- DAILY CARE (5 articles)
-- -------------------------------------------------------

-- Article 21
('Creating a Morning Routine That Reduces Anxiety', 'daily_care',
 'A predictable morning routine can set a calm, positive tone for the entire day. Here is how to build one that works.',
 'Morning can be one of the most challenging times of day for people with Alzheimer''s disease. Waking up in a state of confusion, not remembering the day or the plan, can trigger anxiety before the day has even begun. A well-designed morning routine provides the structure and predictability that the anxious brain craves. When your loved one knows what comes next, even if they cannot articulate it, their nervous system relaxes.

Start with a gentle wake-up. Avoid startling your loved one with a loud alarm or sudden bright lights. Instead, enter the room calmly, open the curtains slowly to let in natural light, and greet them with a warm, familiar phrase. Something like, ''Good morning, it is a beautiful day,'' spoken in the same gentle tone each morning, becomes an auditory anchor. Over time, hearing that phrase signals safety and the beginning of a known sequence.

Keep the first thirty minutes slow and predictable. Help your loved one use the bathroom, wash their face, and brush their teeth in the same order every day. Having toiletries laid out in the same arrangement helps. If your loved one uses the NeuBridge companion pet, a morning greeting with the pet can be the very first pleasant interaction of the day. The familiar face and cheerful message from the pet reinforces that this is a good day.

Serve a familiar breakfast at a consistent time. Novelty at breakfast is not helpful for someone with Alzheimer''s. If your loved one has always enjoyed toast and coffee, serve toast and coffee. If they prefer oatmeal with berries, make that the standard. The taste and smell of a familiar breakfast activates long-term memories and provides comfort. Set the table the same way each morning using the same placemat, plate, and cup.

Play familiar music softly in the background during breakfast. Music from your loved one''s young adult years, roughly ages 15 to 25, tends to be the most deeply encoded in memory and can create an almost immediate sense of ease and happiness. A simple Bluetooth speaker with a saved playlist makes this effortless.

Dress after breakfast when your loved one is more alert. Lay out clothing in the order it should be put on, and limit choices to two options at most. Too many choices create confusion. Using clothing with simple closures like elastic waistbands, velcro, and pullover tops reduces frustration.

Post a simple visual schedule on the wall or refrigerator showing the morning routine with pictures or large text. Even if your loved one cannot read every word, the visual structure communicates that there is a plan and someone is in charge. This alone can reduce morning anxiety significantly.',
 'Alzheimer''s Association daily care guidelines; NeuBridge care team; Teepa Snow positive approach to care', NOW())
ON CONFLICT DO NOTHING,

-- Article 22
('Bedtime Strategies for Better Sleep', 'daily_care',
 'Sleep problems are common in Alzheimer''s disease. These evidence-based bedtime strategies can help your loved one rest more peacefully.',
 'Sleep disturbances affect up to 45 percent of people with Alzheimer''s disease, making them one of the most common and exhausting challenges for caregivers. Your loved one may have trouble falling asleep, wake frequently during the night, wander after dark, or experience sundowning, a pattern of increased agitation in the late afternoon and evening. While sleep problems in Alzheimer''s cannot always be eliminated, a consistent bedtime routine can significantly improve the quality and duration of rest.

Start winding down about two hours before the target bedtime. Dim the lights throughout the house gradually. Bright lighting, especially from overhead fluorescent fixtures, suppresses melatonin production and signals the brain to stay awake. Switch to warm, soft lighting from table lamps. Close curtains to block out any remaining daylight.

Reduce stimulation in the evening. Turn off the television, especially news programs or shows with loud, sudden noises. Avoid difficult conversations or activities that might cause frustration. The goal is to create a calm, predictable environment that tells the brain it is time to slow down.

Establish a short bedtime sequence that happens in the same order every night. This might include changing into pajamas, brushing teeth, using the bathroom, and then settling into bed. Some caregivers add a brief, pleasant ritual like reading a few pages of a familiar book, listening to a favorite calm song, or saying a short prayer together. A goodnight interaction with the NeuBridge companion pet can also signal that the day is ending on a positive note.

Temperature matters. A slightly cool room, around 65 to 68 degrees Fahrenheit, promotes better sleep. Make sure bedding is comfortable and that your loved one is not too warm or too cold. Heavy blankets can feel comforting for some people, providing a gentle sense of pressure that reduces restlessness.

Avoid caffeine after noon. This includes coffee, black tea, and chocolate. Some people with Alzheimer''s are more sensitive to caffeine than they were earlier in life. Limit fluids in the two hours before bed to reduce nighttime bathroom trips, but make sure your loved one is well-hydrated earlier in the day.

A warm glass of milk before bed is more than a folk remedy. Milk contains tryptophan, an amino acid that the body converts to serotonin and then melatonin. While the amount is modest, the warmth and familiarity of the ritual may be as helpful as the biochemistry.

If your loved one wanders at night, ensure the home is safe. Install motion-sensor nightlights in hallways and bathrooms. Secure exterior doors with alarms or locks that are not easily opened. Place a baby monitor in their room so you can hear if they get up. Talk to the doctor if nighttime waking is severe, as medication adjustments may help.',
 'Alzheimer''s Association; Sleep Foundation; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- Article 23
('Helping Your Loved One Get Dressed', 'daily_care',
 'Dressing can become a daily struggle as Alzheimer''s progresses. These strategies preserve dignity while reducing frustration for everyone.',
 'Getting dressed is something most of us do on autopilot, but for a person with Alzheimer''s disease, it can become a source of confusion, frustration, and even conflict. The multi-step process of selecting clothes, putting them on in the right order, managing buttons and zippers, and matching items requires executive function skills that the disease progressively erodes. With the right strategies, you can make dressing easier and more dignified for your loved one.

Simplify the closet. A closet full of clothes presents an overwhelming number of choices. Remove out-of-season clothing and items that no longer fit or are difficult to put on. Keep only a small selection of comfortable, familiar outfits that are easy to wear. Some caregivers create a dedicated section of the closet with five or six complete outfits that can be rotated through the week.

Lay out clothes in the order they should be put on. Place undergarments on top, then the shirt, then pants, then socks, then shoes. This sequential arrangement provides a visual guide that reduces the need for decision-making and complex sequencing. Putting the first item directly into your loved one''s hands can initiate the dressing process naturally.

Limit choices to two options at most. Holding up two shirts and saying, ''Would you like the blue one or the green one?'' gives your loved one a sense of control without overwhelming them. If even two choices seem to cause confusion, simply hand them a single outfit and say, ''Here are your clothes for today.''

Choose clothing with simple closures. Replace buttons with velcro, snaps, or magnetic closures whenever possible. Pull-on pants with elastic waistbands are much easier than pants with zippers and belts. Slip-on shoes eliminate the need to tie laces. Bras that clasp in the front are easier to manage than back-closure styles.

Respect preferences and history. If your loved one has always been a sharp dresser, do not put them in sweatpants unless they are comfortable with that. If they have a favorite color, lean into it. Maintaining personal style preserves identity and self-esteem, which are as important as practical convenience.

Allow plenty of time. Rushing creates anxiety for both of you. Build extra time into the morning schedule so that dressing does not feel like a race. If your loved one can still manage some steps independently, let them do as much as they can, even if it takes longer. Offering help only when needed preserves their sense of capability.

Give step-by-step verbal cues when necessary. Instead of saying, ''Get dressed,'' which requires the brain to plan multiple steps, try breaking it down: ''Put your arm through this sleeve. Good. Now the other arm.'' Calm, simple instructions spoken one at a time are much easier to follow than complex directions.',
 'Alzheimer''s Association; Teepa Snow Positive Approach to Care; NeuBridge daily care guidelines', NOW())
ON CONFLICT DO NOTHING,

-- Article 24
('Safe Walking and Movement for Alzheimer''s Patients', 'daily_care',
 'Physical activity supports brain health and overall wellbeing. Here is how to keep your loved one moving safely as Alzheimer''s progresses.',
 'Regular physical movement is one of the most beneficial things a person with Alzheimer''s can do. Research consistently shows that exercise improves mood, reduces agitation, supports better sleep, maintains muscle strength, and may even slow the rate of cognitive decline. The key is finding activities that are safe, enjoyable, and appropriate for your loved one''s current abilities.

Walking is the most accessible form of exercise for most people with Alzheimer''s. A daily walk, even a short one of 15 to 20 minutes, provides fresh air, gentle cardiovascular activity, and a change of scenery. Walk together on familiar routes whenever possible, as unfamiliar environments can cause disorientation and anxiety. Neighborhood sidewalks, park paths, and hallways in the home all work well.

Safety during walks is paramount. Always walk alongside your loved one, not behind them. Hold their hand or link arms to provide stability and prevent sudden changes in direction. Be aware of uneven surfaces, curbs, and obstacles. Avoid walking in very hot or very cold weather, and make sure your loved one wears supportive, non-slip shoes. If balance is a concern, talk to the doctor about whether a cane or walker would be helpful.

Chair exercises are an excellent alternative when walking is not safe or practical. Seated exercises can include arm raises, leg lifts, seated marching, gentle stretching, and even light resistance work with small hand weights or resistance bands. Many communities offer seated exercise classes for older adults, and there are free video programs designed specifically for people with dementia. Even ten minutes of chair exercises twice a day provides meaningful physical activity.

Balance and fall prevention deserve special attention. Falls are the leading cause of injury in people with Alzheimer''s, and the consequences can be devastating. In addition to supervised exercise, ensure the home environment is safe. Remove throw rugs, secure electrical cords, install grab bars in the bathroom, keep pathways clear, and ensure adequate lighting in all areas, especially hallways and stairwells.

Movement does not have to look like traditional exercise to be beneficial. Dancing to favorite music, gentle gardening, folding towels, sweeping the porch, or playing catch with a soft ball all count as physical activity. The best movement is the kind your loved one actually enjoys and will do willingly.

The NeuBridge companion pet can encourage gentle movement through playful prompts and positive reinforcement. When your loved one completes any form of physical activity, the pet celebrates with them, reinforcing the habit and making movement feel like a shared accomplishment rather than a chore. Track activity in the app to build a record of movement over time.',
 'Alzheimer''s Association; National Institute on Aging; American Physical Therapy Association', NOW())
ON CONFLICT DO NOTHING,

-- Article 25
('Understanding and Managing Sundowning', 'daily_care',
 'Sundowning causes increased confusion and agitation in the late afternoon and evening. Here is what causes it and what you can do.',
 'Sundowning is a pattern of increased confusion, agitation, anxiety, and restlessness that occurs in the late afternoon and evening in many people with Alzheimer''s disease. It affects an estimated 20 to 45 percent of people with the condition, and it is consistently ranked as one of the most challenging behaviors for caregivers to manage. Understanding what causes sundowning and having a plan to address it can make evenings significantly more manageable.

The exact causes of sundowning are not fully understood, but researchers believe several factors contribute. As the day progresses, physical and mental fatigue accumulates. The brain, already compromised by Alzheimer''s, has fewer resources to manage behavior and emotions by late afternoon. Changes in light as the sun sets may disrupt the circadian rhythm, the internal clock that regulates sleep and wakefulness. Some researchers believe that damage to the suprachiasmatic nucleus, the brain''s master clock, plays a direct role. Hunger, thirst, pain, and overstimulation throughout the day can also trigger or worsen sundowning.

Prevention starts earlier in the day. Encourage physical activity in the morning or early afternoon, as this can reduce restlessness later. Make sure your loved one eats regular meals and stays hydrated, because low blood sugar and dehydration can both contribute to evening agitation. Limit caffeine to the morning hours.

In the afternoon, begin reducing stimulation. Turn off the television or switch to calming music. Close curtains before the sun begins to set so that the changing light is less noticeable. Turn on indoor lights before the natural light fades so that the transition from day to evening is smooth rather than sudden. A well-lit room feels safer than a darkening one.

Establish a calming late-afternoon routine. A light snack, a warm cup of herbal tea, and a quiet activity like looking at a photo album or listening to familiar music can help ease the transition into evening. A visit with the NeuBridge companion pet during this window can provide gentle, positive engagement that distracts from rising anxiety.

Redirect rather than confront. If your loved one becomes agitated, do not argue or try to reason with them. Instead, calmly acknowledge their feelings and gently redirect their attention. You might say, ''I can see you are feeling uneasy. Let us take a little walk together,'' or ''Your friend is here to see you,'' and guide them to the companion pet.

When sundowning is severe, persistent, or involves aggression or wandering that creates safety risks, it is important to talk to the doctor. There may be underlying medical issues like pain or a urinary tract infection that are worsening the behavior. In some cases, medication adjustments can help. Keep a log of sundowning episodes in the NeuBridge app, noting the time, duration, and any potential triggers, so that you can share detailed information with the healthcare team.',
 'Alzheimer''s Association; Canevelli et al., Journal of Alzheimer''s Disease, 2016; National Institute on Aging', NOW())
ON CONFLICT DO NOTHING,

-- -------------------------------------------------------
-- CAREGIVER WELLNESS (5 articles)
-- -------------------------------------------------------

-- Article 26
('Understanding the Zarit Burnout Scale', 'caregiver_wellness',
 'The Zarit Burden Interview helps caregivers measure their stress level objectively. Understanding your score is the first step toward getting help.',
 'The Zarit Burden Interview, commonly called the Zarit Burnout Scale, is the most widely used tool in clinical research for measuring caregiver stress. Developed by Dr. Steven Zarit at Penn State University, it has been used in hundreds of studies and is considered the gold standard for assessing how caregiving affects a person''s emotional, physical, and financial wellbeing. Understanding this tool can help you recognize when you need more support.

The full version of the Zarit scale consists of 22 questions, each rated on a scale from 0 (never) to 4 (nearly always). The questions address a range of caregiving experiences. Some ask about time pressure, such as whether you feel you do not have enough time for yourself because of the time you spend with your loved one. Others address emotional impact, like whether you feel strained around your loved one or whether you feel your health has suffered because of your involvement in care. Financial questions ask whether you feel you do not have enough money to provide care. Social questions explore whether you feel your social life has suffered.

The total score ranges from 0 to 88. A score of 0 to 20 indicates little or no burden. A score of 21 to 40 suggests mild to moderate burden. A score of 41 to 60 indicates moderate to severe burden. A score of 61 to 88 represents severe burden. Research shows that caregivers scoring above 40 are at significantly higher risk for depression, anxiety, sleep disorders, and physical health problems.

What should you do with your score? First, recognize that any level of burden is valid. Caring for someone with Alzheimer''s is one of the most demanding roles a person can take on, and feeling stressed does not mean you are failing. Your score is a data point, not a judgment.

If your score is in the mild range, focus on maintaining the self-care habits and support systems you already have. If it is in the moderate range, it is time to actively expand your support. This might mean joining a caregiver support group, asking family members to take on specific tasks, or exploring respite care options. If your score is in the severe range, please talk to your own doctor. Caregiver burnout at this level is a medical concern that deserves professional attention.

The NeuBridge app includes a simplified version of the Zarit assessment that you can complete periodically to track your wellbeing over time. Watching your score trend upward is an important early warning signal. Watching it stabilize or decrease after you make changes is powerful validation that your self-care efforts are working. You cannot pour from an empty cup, and monitoring your own burden is an act of responsibility, not selfishness.',
 'Zarit et al., The Gerontologist, 1980; Alzheimer''s Association caregiver research; NeuBridge care team', NOW())
ON CONFLICT DO NOTHING,

-- Article 27
('5-Minute Self-Care for Busy Caregivers', 'caregiver_wellness',
 'You do not need an hour of free time to take care of yourself. These five-minute practices can make a real difference in your day.',
 'When you are caring for someone with Alzheimer''s disease, self-care can feel like a luxury you cannot afford. Your days are filled with medications, meals, appointments, and the constant vigilance that dementia caregiving requires. Finding an hour for yourself may genuinely be impossible some days. But five minutes? Five minutes is almost always within reach, and research shows that even brief self-care practices can reduce stress hormones, lower blood pressure, and improve your mood.

Deep breathing is the fastest way to activate your body''s relaxation response. It takes less than two minutes and you can do it anywhere. Breathe in slowly through your nose for a count of four, hold for a count of four, and exhale slowly through your mouth for a count of six. Repeat this four or five times. This simple exercise stimulates the vagus nerve, which tells your nervous system to shift from fight-or-flight mode to rest-and-digest mode. Many caregivers do this in the bathroom or while waiting for the microwave, brief pockets of time that are already built into the day.

Write a gratitude note. Take three minutes and write down three things you are grateful for today. They do not have to be big things. Maybe the sun came out. Maybe your loved one smiled at you during breakfast. Maybe someone brought you coffee. Research from the University of California found that people who practiced daily gratitude experienced less depression and more resilience than those who did not. Keep a small notebook by your bed or use the notes app on your phone.

Step outside. Even a two-minute walk to the mailbox and back exposes you to natural light, fresh air, and a change of scenery. Sunlight helps regulate your circadian rhythm and boosts vitamin D production, both of which support mood and energy. If you cannot leave the house, stand by an open window and take a few deep breaths of outdoor air.

Call or text a friend. Social isolation is one of the biggest risks caregivers face, and staying connected does not require a long lunch date. A two-minute phone call to say hello, a funny text, or a quick voice message to a friend can remind you that you exist outside of your caregiving role. You are a whole person, and maintaining those connections matters.

Set one boundary. Boundaries are a form of self-care that costs nothing and takes less than a minute. It might sound like, ''I am going to sit down for five minutes before I clean the kitchen.'' Or, ''I am not going to check on Mom between 9 and 9:30 tonight because she is safe and I need a break.'' Small boundaries prevent small stresses from snowballing into big ones. The NeuBridge app tracks caregiver wellness alongside patient care because your health matters just as much. Take your five minutes today. You have earned them.',
 'Harvard Health Publishing; University of California gratitude research; Alzheimer''s Association caregiver wellness', NOW())
ON CONFLICT DO NOTHING,

-- Article 28
('When Is It Time to Ask for Help?', 'caregiver_wellness',
 'Recognizing when you need more support is not weakness. It is wisdom. Here are the signs that it is time to expand your caregiving team.',
 'There is a moment in nearly every caregiver''s journey when the weight becomes too much to carry alone. Recognizing that moment and acting on it is one of the bravest and most important things you can do, both for yourself and for the person you are caring for. Yet many caregivers push past the warning signs, telling themselves they should be able to handle it, that asking for help means they are failing. It does not. It means you are paying attention.

Here are the warning signs that it is time to ask for more help. You are exhausted all the time, not just physically tired but a deep fatigue that sleep does not fix. You have lost interest in things you used to enjoy. Friends have stopped calling because you always say you are too busy. You find yourself feeling resentful toward your loved one, then guilty for feeling resentful. You are getting sick more often than usual. You are using alcohol, food, or other coping mechanisms more than you would like. You snap at small things. You cry in the shower. You cannot remember the last time you did something just for yourself.

If you recognize yourself in even two or three of these signs, you are not just tired. You are approaching or already in caregiver burnout, and it is time to take action.

Respite care is one of the most valuable resources available. Respite care means someone else takes over caregiving duties for a set period of time so you can rest. This could be a few hours a week from a paid in-home aide, a day at an adult day program where your loved one can socialize while you have time for yourself, or a short stay at a respite facility while you take a longer break.

Adult day programs are often covered partially by Medicaid or offered on a sliding scale. They provide structured activities, social engagement, meals, and supervision, often from 9 AM to 3 PM on weekdays. Many caregivers describe adult day programs as a lifeline.

In-home aides can help with personal care, meal preparation, light housekeeping, and companionship. Even having someone come for just four hours, twice a week, can make an enormous difference in your energy and mental health.

Support groups, whether in person or online, provide something that friends and family often cannot: the understanding of people who truly know what you are going through. The Alzheimer''s Association offers free support groups in every state, and many are available virtually.

Talk to your own doctor honestly about how you are feeling. Caregivers have higher rates of depression, anxiety, and cardiovascular disease than the general population. Your doctor can screen you, connect you with mental health resources, and help you develop a sustainable plan. You cannot care well for someone else if you are running on empty. Asking for help is not giving up. It is the smartest thing you can do.',
 'Alzheimer''s Association; National Alliance for Caregiving; AARP caregiver resources', NOW())
ON CONFLICT DO NOTHING,

-- Article 29
('Building Your Caregiving Team', 'caregiver_wellness',
 'You were never meant to do this alone. Here is how to build a team of family, friends, and professionals who share the caregiving load.',
 'Solo caregiving is a recipe for burnout. No matter how dedicated, capable, or loving you are, caring for someone with Alzheimer''s disease around the clock without support will eventually exhaust you. Building a caregiving team is not a sign of weakness. It is one of the smartest and most sustainable decisions you can make. The question is not whether you need a team. It is how to build one.

Start with a family meeting. If you have siblings, adult children, or other family members, schedule a candid conversation about your loved one''s care needs. Be specific about what you need help with. Instead of saying, ''I need more support,'' try, ''I need someone to take Mom to her Tuesday doctor appointments, someone to handle grocery shopping, and someone to stay with her on Saturday mornings so I can rest.'' Specific requests are easier for people to commit to than vague ones.

Create a task list and let people choose. Some family members are better at hands-on care. Others are better at logistics like managing insurance paperwork, researching resources, or handling finances. Some live far away but can contribute by paying for an in-home aide or making daily phone calls to keep your loved one socially engaged. Everyone can contribute something. The key is matching tasks to each person''s strengths and availability.

Include professional help in your team. A primary care physician manages medical care. A geriatric care manager can coordinate services and navigate the healthcare system on your behalf. An in-home aide provides hands-on daily support. An adult day program offers structured daytime care. A social worker can connect you with community resources, financial assistance, and legal guidance. A therapist or counselor supports your mental health. You do not need all of these at once, but knowing they exist means you can add them as needs increase.

Do not forget your community. Neighbors, friends from church or temple, members of social clubs, and coworkers can all be part of your support network. Many people genuinely want to help but do not know what to offer. When someone says, ''Let me know if there is anything I can do,'' take them at their word. Ask them to bring a meal, sit with your loved one for an hour, or simply call you for a check-in conversation.

The NeuBridge app supports your team by making caregiving information accessible to multiple people. Care data, activity logs, and health trends can be shared with authorized team members so that everyone stays informed without requiring you to repeat updates constantly.

Finally, identify a backup caregiver. This is someone who can step in on short notice if you get sick, have an emergency, or simply need a mental health day. Having a backup is not planning for failure. It is planning for reality. Life happens, and knowing that someone can cover for you provides enormous peace of mind.',
 'Alzheimer''s Association; Family Caregiver Alliance; NeuBridge care team', NOW())
ON CONFLICT DO NOTHING,

-- Article 30
('Finding Joy in Caregiving', 'caregiver_wellness',
 'Caregiving is hard, but it is not only hard. Here is how to find and hold onto the moments of genuine joy that make this journey meaningful.',
 'It may seem strange to talk about joy in the same conversation as Alzheimer''s caregiving. The grief is real. The exhaustion is real. The frustration and fear and sense of loss are all deeply, painfully real. And yet, within this experience, there are moments of genuine joy, small, tender, sometimes surprising moments that remind you why this matters and who you are doing it for. Learning to notice and hold onto these moments is not denial. It is survival.

Joy in caregiving often comes in small packages. It is the way your loved one''s face lights up when they hear a song from their youth. It is the unexpected moment of clarity when they say your name and really see you. It is the sound of shared laughter over a silly moment at the dinner table. It is a warm hand reaching for yours during a walk around the block. These moments may be brief, but they are real and they are precious.

Music is one of the most reliable sources of shared joy. The parts of the brain that process music are among the last to be affected by Alzheimer''s disease. Songs from your loved one''s teenage years and early adulthood are often deeply embedded in memory, and hearing them can produce an emotional response that transcends the disease. Singing together, swaying to the music, or simply sitting side by side while a favorite album plays can create moments of connection that feel like the disease has briefly stepped out of the room.

Laughter is another gift. People with Alzheimer''s retain their sense of humor much longer than many people realize. A funny face, a silly voice, a gentle joke, or a playful moment with the companion pet can bring genuine laughter. Humor relieves stress for both of you and creates a sense of normalcy and partnership.

The gift of presence is perhaps the most profound source of joy in caregiving. There is a particular kind of love that emerges when you slow down enough to simply be with someone. Not doing for them, not managing their care, just sitting together. Holding hands. Watching the birds outside the window. Being two people in a quiet room, together. In a culture that values productivity and busyness, this kind of presence can feel unproductive. It is anything but.

Celebrate small victories. Your loved one got dressed with minimal help today. They ate a full meal. They smiled at the companion pet. They remembered the name of their childhood dog. These are wins, and acknowledging them, even if only to yourself, builds a reservoir of positivity that helps sustain you through the harder moments.

Consider keeping a joy journal. At the end of each day, write down one moment of joy, connection, or gratitude. On the hardest days, go back and read previous entries. They are evidence that even in the midst of Alzheimer''s, love and beauty persist.

You are doing something extraordinary. The world may not always see it or name it, but caring for a person with Alzheimer''s with tenderness and dedication is one of the most loving things a human being can do. Hold onto the joy. It is yours and you have earned every moment of it.',
 'Alzheimer''s Association; Positive Approach to Care; NeuBridge caregiver wellness team', NOW())
ON CONFLICT DO NOTHING;


-- ============================================================
-- SECTION B: JOURNAL PROMPTS (25 prompts)
-- ============================================================

INSERT INTO journal_prompts (prompt_text, category, stage_appropriate, sort_order, created_at)
VALUES

-- Childhood (5)
('What games did you play as a child? Who did you play with?', 'childhood', ARRAY['early', 'middle', 'late'], 1, NOW())
ON CONFLICT DO NOTHING,
('Tell me about the house you grew up in. What did it look like?', 'childhood', ARRAY['early', 'middle', 'late'], 2, NOW())
ON CONFLICT DO NOTHING,
('What was your favorite thing to eat when you were little?', 'childhood', ARRAY['early', 'middle', 'late'], 3, NOW())
ON CONFLICT DO NOTHING,
('Did you have a pet growing up? What was its name?', 'childhood', ARRAY['early', 'middle', 'late'], 4, NOW())
ON CONFLICT DO NOTHING,
('What is your earliest memory of school?', 'childhood', ARRAY['early', 'middle', 'late'], 5, NOW())
ON CONFLICT DO NOTHING,

-- Family (5)
('Tell me about the day you met your spouse. Where were you?', 'family', ARRAY['early', 'middle', 'late'], 6, NOW())
ON CONFLICT DO NOTHING,
('What is one thing your mother always said to you?', 'family', ARRAY['early', 'middle', 'late'], 7, NOW())
ON CONFLICT DO NOTHING,
('Describe a family tradition that was special to you.', 'family', ARRAY['early', 'middle', 'late'], 8, NOW())
ON CONFLICT DO NOTHING,
('What did your father do for work? What do you remember about it?', 'family', ARRAY['early', 'middle', 'late'], 9, NOW())
ON CONFLICT DO NOTHING,
('Tell me about a time your family all laughed together.', 'family', ARRAY['early', 'middle', 'late'], 10, NOW())
ON CONFLICT DO NOTHING,

-- Food (5)
('What is your favorite meal that someone used to cook for you?', 'food', ARRAY['early', 'middle', 'late'], 11, NOW())
ON CONFLICT DO NOTHING,
('Do you remember the smell of something baking in your kitchen?', 'food', ARRAY['early', 'middle', 'late'], 12, NOW())
ON CONFLICT DO NOTHING,
('What was a special food you only had on holidays?', 'food', ARRAY['early', 'middle', 'late'], 13, NOW())
ON CONFLICT DO NOTHING,
('Tell me about a meal you shared with someone you love.', 'food', ARRAY['early', 'middle', 'late'], 14, NOW())
ON CONFLICT DO NOTHING,
('What is a food from your childhood that you still enjoy?', 'food', ARRAY['early', 'middle', 'late'], 15, NOW())
ON CONFLICT DO NOTHING,

-- Music (3)
('What song always makes you want to sing along?', 'music', ARRAY['early', 'middle', 'late'], 16, NOW())
ON CONFLICT DO NOTHING,
('Tell me about a time you danced. Who were you dancing with?', 'music', ARRAY['early', 'middle', 'late'], 17, NOW())
ON CONFLICT DO NOTHING,
('What kind of music did your family listen to?', 'music', ARRAY['early', 'middle', 'late'], 18, NOW())
ON CONFLICT DO NOTHING,

-- Places (3)
('If you could visit any place from your past, where would you go?', 'places', ARRAY['early', 'middle', 'late'], 19, NOW())
ON CONFLICT DO NOTHING,
('Tell me about a vacation you took that you will never forget.', 'places', ARRAY['early', 'middle', 'late'], 20, NOW())
ON CONFLICT DO NOTHING,
('What did your neighborhood look like when you were young?', 'places', ARRAY['early', 'middle', 'late'], 21, NOW())
ON CONFLICT DO NOTHING,

-- Holidays (2)
('What is your favorite holiday memory?', 'holidays', ARRAY['early', 'middle', 'late'], 22, NOW())
ON CONFLICT DO NOTHING,
('Tell me about the best birthday you ever had.', 'holidays', ARRAY['early', 'middle', 'late'], 23, NOW())
ON CONFLICT DO NOTHING,

-- Gratitude (2)
('What is one thing you are thankful for today?', 'gratitude', ARRAY['early', 'middle', 'late'], 24, NOW())
ON CONFLICT DO NOTHING,
('Who is someone who made your life better?', 'gratitude', ARRAY['early', 'middle', 'late'], 25, NOW())
ON CONFLICT DO NOTHING;


-- ============================================================
-- SECTION C: ENCOURAGEMENT MESSAGES (20 messages)
-- ============================================================

INSERT INTO encouragement_templates (message_text, trigger_type, mood_context, created_at)
VALUES

-- Activity Complete
('[PET_NAME] is so proud of you, [PATIENT_NAME]! Great job today.', 'activity_complete', 'happy', NOW())
ON CONFLICT DO NOTHING,
('You did something wonderful just now. [PET_NAME] is wagging with joy!', 'activity_complete', 'any', NOW())
ON CONFLICT DO NOTHING,
('Every step you take matters, [PATIENT_NAME]. [PET_NAME] thinks so too.', 'activity_complete', 'neutral', NOW())
ON CONFLICT DO NOTHING,

-- Morning Greeting
('Good morning, [PATIENT_NAME]! [PET_NAME] has been waiting to see you.', 'morning_greeting', 'any', NOW())
ON CONFLICT DO NOTHING,
('Rise and shine! [PET_NAME] is excited to spend the day with you.', 'morning_greeting', 'happy', NOW())
ON CONFLICT DO NOTHING,
('A new day is here, [PATIENT_NAME]. [PET_NAME] is right by your side.', 'morning_greeting', 'neutral', NOW())
ON CONFLICT DO NOTHING,

-- Mood Support
('It is okay to feel this way, [PATIENT_NAME]. [PET_NAME] is here with you.', 'mood_support', 'sad', NOW())
ON CONFLICT DO NOTHING,
('You are not alone. [PET_NAME] is keeping you company.', 'mood_support', 'anxious', NOW())
ON CONFLICT DO NOTHING,
('Take a deep breath. [PET_NAME] is breathing with you.', 'mood_support', 'anxious', NOW())
ON CONFLICT DO NOTHING,
('You are safe and loved. [PET_NAME] is watching over you.', 'mood_support', 'sad', NOW())
ON CONFLICT DO NOTHING,

-- Hydration Reminder
('Time for a sip of water! [PET_NAME] is thirsty too.', 'hydration_reminder', 'any', NOW())
ON CONFLICT DO NOTHING,
('Stay hydrated, [PATIENT_NAME]! [PET_NAME] just had a drink.', 'hydration_reminder', 'any', NOW())
ON CONFLICT DO NOTHING,
('A glass of water would feel great right now. [PET_NAME] agrees!', 'hydration_reminder', 'neutral', NOW())
ON CONFLICT DO NOTHING,

-- Meal Encouragement
('That meal looked delicious! [PET_NAME] hopes you enjoyed it.', 'meal_encouragement', 'any', NOW())
ON CONFLICT DO NOTHING,
('Eating well is a gift to your brain. [PET_NAME] is cheering you on!', 'meal_encouragement', 'any', NOW())
ON CONFLICT DO NOTHING,

-- General
('You are doing so well today, [PATIENT_NAME].', 'general', 'any', NOW())
ON CONFLICT DO NOTHING,
('[PET_NAME] loves spending time with you, [PATIENT_NAME].', 'general', 'any', NOW())
ON CONFLICT DO NOTHING,
('Every moment you share makes [PET_NAME] happier.', 'general', 'happy', NOW())
ON CONFLICT DO NOTHING,
('You bring so much light to the world, [PATIENT_NAME].', 'general', 'any', NOW())
ON CONFLICT DO NOTHING,
('Remember, [PATIENT_NAME], you are cherished. [PET_NAME] knows it.', 'general', 'neutral', NOW())
ON CONFLICT DO NOTHING;


-- ============================================================
-- VERIFICATION QUERIES (run after migration to confirm counts)
-- ============================================================

-- SELECT 'resource_articles' AS table_name, COUNT(*) AS row_count FROM resource_articles
-- UNION ALL
-- SELECT 'journal_prompts', COUNT(*) FROM journal_prompts
-- UNION ALL
-- SELECT 'encouragement_templates', COUNT(*) FROM encouragement_templates;
