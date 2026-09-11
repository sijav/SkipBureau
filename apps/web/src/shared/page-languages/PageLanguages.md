# PageLanguages

SB-086: the canonical address of a page and, where it exists in more than
one language, an alternate per language and x-default. React 19 lifts these
links into the head wherever they are rendered, and takes them out when
the page goes. A page in one language says nothing about others, so a
reader is never pointed at a translation that does not exist.
