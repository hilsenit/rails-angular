class ProductSearchTerm
  attr_reader :where_clause, :where_args, :order
  def initialize(search_term)
    search_term = search_term.downcase
    @where_clause = ""
    @where_args = {}
    build_for_everythingh(search_term)
  end

  private

  def build_for_everythingh(search_term)
    # Søgninger via email viser også brugere, som har fornavn eller efternavn, der indgår i email-adressen.
    @where_clause << case_insensitive_search(:title)
    @where_args[:title] = starts_with(search_term)

    @where_clause << " OR #{case_insensitive_search(:subtitle)}"
    @where_args[:subtitle] = starts_with(search_term)

    @where_clause << " OR #{case_insensitive_search(:authors)}"
    @where_args[:authors] = search_term

    @order = "lower(authors) = " +
      ActiveRecord::Base.connection.quote(search_term) +
      " desc, title asc"
  end

  def starts_with(search_term)
    search_term + "%"
  end

  def case_insensitive_search(field_name)
    "lower(#{field_name}) like :#{field_name}"
  end

  # def build_for_authors_search(search_term)
  #   @where_clause << case_insensitive_search(:title)
  #   @where_args[:title] = starts_with(search_term)

  #   @where_clause << " OR #{case_insensitive_search(:subtitle)}"
  #   @where_args[:subtitle] = starts_with(search_term)

  #   @order = "subtitle asc"
  # end

  # def extract_name(search_term)
  #   # Fjern alt efter @, derefter fjern alle tal!
  #   search_term.gsub(/@.*$/,'').gsub(/[0-9]+/,'')
  # end

end
