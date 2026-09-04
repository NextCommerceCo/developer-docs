---
title: 'Filter Reference'
description: Built-in Django Template Language filters for lists, formatting, strings, currency, asset URLs, and math
---

## Arrays & Lists

### dictsort
Takes a list of dictionaries and returns that list sorted by the key given in the argument.
```django title="dictsort"
{{ value|dictsort:"name" }}
```
For example:
```django title="dictsort"
{{ value|dictsort:"category" }}
```
If value is:

```json title="dictsort"
[
    {'category': 'B', 'count': 4},
    {'category': 'C', 'count': 22},
    {'category': 'A', 'count': 12}
]
```
then the output would be:
```json title="dictsort Output"
[
    {'category': 'A', 'count': 12},
    {'category': 'B', 'count': 4},
    {'category': 'B', 'count': 4}
]
```
### dictsortedreversed
Takes a list of dictionaries and returns that list sorted in reverse order by the key given in the argument. This works exactly the same as the above filter, but the returned value will be in reverse order.

### first
Returns the first item in a list.

```django title="first"
{{ value|first }}
```

For example, if value is the list ['a', 'b', 'c'], the output will be 'a'.

### join

Joins a list with a string.

```django title="join"
{{ value|join:" - " }}
```

For example, if value is the list ['a', 'b', 'c'], the output will be the string "a - b - c".

### last

Returns the last item in a list.

```django title="last"
{{ value|last }}
```
For example, if value is the list ['a', 'b', 'c', 'd'], the output will be the string "d".

### slice

Returns a slice of the list.

```django title="slice"
{{ some_list|slice:":2" }}
```
For example, if some_list is ['a', 'b', 'c'], and slice to first 2, the output will be ['a', 'b'].


### unordered_list

Recursively takes a self-nested list and returns an HTML unordered list – WITHOUT opening and closing  `<ul>` tags. The list is assumed to be in the proper format.

```django title="unordered_list"
{{ value|unordered_list }}
```

For example, if var contains `['States', ['Kansas', ['Lawrence', 'Topeka'], 'Illinois']]`, then `{{ var|unordered_list }}` would return:

```django title="unordered_list"
<li>States
    <ul>
        <li>Kansas
            <ul>
                <li>Lawrence</li>
                <li>Topeka</li>
            </ul>
        </li>
        <li>Illinois</li>
    </ul>
</li>
```


## Default


### default
If value evaluates to False, uses the given default. Otherwise, uses the value.
```django title="default"
{{ value|default:"something" }}
```
For example, If value is "" (an empty string), the output will be something.

### default_if_none
If (and only if) value is None, uses the given default. Otherwise, uses the value. Note that if an empty string is given, the default value will not be used. Use the default filter if you want to fallback for empty strings.
```django title="default_if_none"
{{ value|default_if_none:"something" }}
```
For example, if value is None, the output will be something.


## Format

### date
Formats a date according to the given format.
```django title="date"
{{ value|date:"D d M Y" }}
```

For example, `{{ value|date:"D d M Y" }}` this would convert a date to this format output will be the string Wed 09 Jan 2020. See available date reference for format options.

### escape
Escapes a string’s HTML. Specifically, it makes these replacements:
< is converted to &lt;> is converted to &gt;' (single quote) is converted to &#x27;" (double quote) is converted to &quot;& is converted to &amp;
```django title="escape"
{{ title|escape }}
```

### escapejs
Escapes characters for use in JavaScript strings. This does not make the string safe for use in HTML or JavaScript template literals, but does protect you from syntax errors when using templates to generate JavaScript/JSON.
```django title="escapejs"
{{ value|escapejs }}
```
For example, if value is <b>escaping</b>, the output will be \\u003Cb\\u003Eescaping\\u003C/b\\u003E


### json_script

Safely outputs a variable object as JSON, wrapped in a `<script>` tag, ready for Javascript.

```django title="json_script"
{{ value|json_script:"my-data" }}
```

For example, if value is the dictionary `{'hello': 'world'}`, the output will be:

```html title="json_script"
<script id="my-data" type="application/json">{"hello": "world"}</script>
```

### make_list

Returns the value turned into a list. For a string, it’s a list of characters. For an integer, the argument is cast to a string before creating a list.

```django title="make_list"
{{ value|make_list }}
```


## Internationalization


### language_name_local
Returns a localized name of the language.
```django title="language_name_local"
{{ LANGUAGE_CODE|language_name_local }}
```
For example, if the value is `fr`, the output would be `Français`.


## Integers

### divisibleby
Returns True if the value is divisible by the argument.
```django title="divisibleby"
{{ value|divisibleby:"3" }}
```
For example, if value is 21, the output would be True.


### floatformat

Allows you to specify the number of decimal places to format a float to.

```django title="floatformat"
{{ value|floatformat:2 }}
```

For example, if value is 34.2342 and use floatformat:2, the output will be 34.23.


## HTML

### linebreaks
Replaces line breaks in plain text with appropriate HTML; a single newline becomes an HTML line break `<br>` and a new line followed by a blank line becomes a paragraph break `</p>`.
```django title="linebreaks"
{{ value|linebreaks }}
```
For example, if value is Joel\nis a slug, the output will be `<p>Joel<br>is a slug</p>`.

### linebreaksbr

Converts all newlines in a piece of plain text to HTML line breaks `<br>`. If value is Sandy is a slug, the output will be ```Sandy<br>is a slug```.

```django title="linebreaksbr"
{{ value|linebreaksbr }}
```

### truncatewords_html
Similar to truncatechars, except that it is aware of HTML tags. Any tags that are opened in the string and not closed before the truncation point are closed immediately after the truncation.

```django title="truncatewords_html"
{{ value|truncatechars_html:7 }}
```
For example, if value is `<p>Sandy is a slug</p>`, the output will be `<p>Sandy i…</p>`.


## Strings


### capfirst
Capitalizes the first character of the value.
```django title="capfirst"
{{ value|capfirst }}
```
For example,  if the first character is not a letter, this filter has no effect. For example, if value is chicago, the output will be Chicago.


### cut
Removes all values of arg from the given string.
```django title="cut"
{{ value|cut:" " }}
```
For example, if value is String with spaces, the output will be Stringwithspaces.



### length

Returns the length of the value. This works for both strings and lists.

```django title="length"
{{ value|length }}
```
For example, if value is `['a', 'b', 'c', 'd']` or "abcd", the output will be 4.

### length_is

Returns True if the value’s length is the argument, or False otherwise.

```django title="length_is"
{{ value|length_is:"4" }}
```
For example, if value is ['a', 'b', 'c', 'd'] or "abcd", the output will be True.


### linenumbers

Displays text with line numbers.

```django title="linenumbers"
{{ value|linenumbers }}
```
For example, if value is:
```django title="linenumbers"
one
two
three
```
the output will be:

```django title="linenumbers Output"
1. one
2. two
3. three
```



### lower
Converts a string into all lowercase.
```django title="lower"
{{ value|lower }}
```
For example, if value is Totally LOVING this Product!, the output will be totally loving this product!.



For example, if value is the string "Sandy", the output would be the list ['S', 'a', 'n', 'd', 'y']. If value is 123, the output will be the list ['1', '2', '3'].

### pluralize
Returns a plural suffix if the value is not 1, '1', or an object of length 1. By default, this suffix is 's'.

```jinja title="pluralize"
You have {{ num_messages }} message{{ num_messages|pluralize }}
```

### split
Splits a string by the given delimiter and returns a list.
```django title="split"
{{ value|split:"," }}
```
For example, if value is `"red,green,blue"`, the output will be the list `['red', 'green', 'blue']`.

### slugify

Converts to ASCII. Converts spaces to hyphens. Removes characters that aren’t alphanumerics, underscores, or hyphens. Converts to lowercase. Also strips
leading and trailing whitespace.

```django title="slugify"
{{ value|slugify }}
```

For example, if value is "Sandy is a slug", the output will be "sandy-is-a-slug".

### title

Converts a string into titlecase by making words start with an uppercase character and the remaining characters lowercase. This tag makes no effort to keep “trivial words” in lowercase.

```django title="title"
{{ value|title }}
```
For example, if value is "my FIRST post", the output will be "My First Post".


### truncatewords
Truncates a string after a certain number of words based on the argument.

```django title="truncatewords"
{{ value|truncatewords:2 }}
```
For example, if value is "Sandy is a slug", the output will be "Sandy is …".


### upper
Converts a string into all uppercase.
```django title="upper"
{{ value|upper }}
```
For example, if value is "Sandy is a slug", the output will be "SANDY IS A SLUG".

### urlencode
Escapes a value for use in a URL.
```django title="urlencode"
{{ value|urlencode }}
```
For example, if value is "https://www.example.org/", the output will be "https%3A%2F%2Fwww.example.org%2F".


### wordcount

Returns the number of words.

```django title="wordcount"
{{ value|wordcount }}
```

For example, if value is "Joel is a slug", the output will be 4.

## Currency

### currency
Formats a decimal value as a currency string using the provided currency code. This is the primary filter for displaying prices throughout a theme.
```django title="currency"
{{ session.price.price|currency:session.price.currency }}
```
For example, if the price is `29.99` and the currency is `USD`, the output will be `$29.99`. The filter handles currency symbol placement and formatting based on the currency code.

```django title="Example Product Price Display"
{% purchase_info_for_product request product as session %}
{% if session.price.exists %}
    {% if session.price.price_retail %}
        <span class="text-muted text-decoration-line-through">
            {{ session.price.price_retail|currency:session.price.currency }}
        </span>
    {% endif %}
    <span class="fw-bold">
        {{ session.price.price|currency:session.price.currency }}
    </span>
{% endif %}
```

## Files

### asset_url
The asset_url filter can be applied to theme asset files to generate CDN link to the asset for loading in the template HTML. The file argument is relative to the assets directory of the theme.
```django title="asset_url"
{{ 'style.css'|asset_url }}
```


## Math

### add
Adds the argument to the value.
```django title="add"
{{ value|add:2 }}
```
For example, if value is 4, then the output will be 6. The filter will try to force both values to integers. If this fails, it’ll attempt to add the values together anyway. If it fails, the result will be an empty string.

### abs
Returns the absolute value of a number.
```django title="abs"
{{ value|abs }}
```
For example, if value is -3, the output would be 3. The filter will return the absolute value.

### atleast
Limits a number to a minimum value.
```django title="atleast"
{{ value|atleast:5 }}
```
For example, if the value is 3, the filter would return 5.

### atmost
Limits a number to a maximum value.
```django title="atmost"
{{ value|atmost:5 }}
```
For example, if the value is 7, the filter would return 5.

### ceil
Rounds a number up to the nearest integer.
```django title="ceil"
{{ value|ceil }}
```
For example, if the value was 1.2, the filter would return 2.

### dividedby
Divides a number by a given number.
```django title="dividedby"
{{ value|dividedby:3 }}
```
For example, if the value was 9, the filter would return 3.

### floor
Rounds a number down to the nearest integer.
```django title="floor"
{{ value|floor }}
```
For example, if the value was 1.2, the filter would return 1.

### minus
Subtracts a given number from another number.
```django title="minus"
{{ value|minus:2.5 }}
```

For example, if the value was 5, the filter would return 2.5.

### modulo
Returns the remainder of dividing a number by a given number.
```django title="modulo"
{{ value|modulo:5 }}
```
For example, if the value was 12, the filter would return 2.

### plus
Adds two numbers.
```django title="plus"
{{ value|plus:5 }}
```

For example, if the value was 5, the filter would return 10.

### round
Rounds a number to the nearest integer.
```django title="round"
{{ value|round }}
```
For example, if the value was 2.7, the filter would return 3.

### times
Multiplies a number by a given number.
```django title="times"
{{ value|times:3 }}
```
For example if the value was 2, the filter would return 9.
