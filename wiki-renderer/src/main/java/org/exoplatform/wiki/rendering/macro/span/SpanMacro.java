/*
 * Copyright (C) 2003-2011 eXo Platform SAS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
package org.exoplatform.wiki.rendering.macro.span;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import org.apache.commons.lang.StringUtils;
import org.exoplatform.wiki.rendering.macro.MacroUtils;
import org.xwiki.component.annotation.Component;
import org.xwiki.component.manager.ComponentManager;
import org.xwiki.rendering.block.Block;
import org.xwiki.rendering.block.FormatBlock;
import org.xwiki.rendering.listener.Format;
import org.xwiki.rendering.macro.AbstractMacro;
import org.xwiki.rendering.macro.MacroExecutionException;
import org.xwiki.rendering.macro.descriptor.DefaultContentDescriptor;
import org.xwiki.rendering.transformation.MacroTransformationContext;
import org.xwiki.rendering.util.ParserUtils;

@Component("span")
public class SpanMacro extends AbstractMacro<SpanParameters> {
  
  private static final String CLASS_ATT           = "class";

  private static final String STYLE_ATT           = "style";

  /**
   * The description of the macro
   */
  private static final String DESCRIPTION         = "Decorate text line";
  
  /**
   * Used to get the current syntax parser.
   */
  @Inject
  private ComponentManager componentManager;

  public SpanMacro() {
    super("Span", DESCRIPTION, new DefaultContentDescriptor(), SpanParameters.class);
    setDefaultCategory(DEFAULT_CATEGORY_FORMATTING);
  }

  @Override
  public List<Block> execute(SpanParameters parameters, String content, MacroTransformationContext context) throws MacroExecutionException {
    if (content != null) {
      String cssClass = parameters.getCssClass();
      String cssContent = parameters.getStyle();

      Map<String, String> params = new HashMap<String, String>();
      if (!StringUtils.isEmpty(cssClass)) {
        if (!StringUtils.isEmpty(cssClass))
          params.put(CLASS_ATT, cssClass);
      }
      if (!StringUtils.isEmpty(cssContent)) {
        params.put(STYLE_ATT, cssContent);
      }
      List<Block> contentBlocks = MacroUtils.parseSourceSyntax(getComponentManager(), content, context);
      (new ParserUtils()).removeTopLevelParagraph(contentBlocks);
      Block spanBlock = new FormatBlock(contentBlocks, Format.NONE, params);
      return Collections.singletonList(spanBlock);
    } else {
      return Collections.emptyList();
    }
  }

  @Override
  public boolean supportsInlineMode() {
    return true;
  }
  
  /**
   * @return the component manager.
   */
  public ComponentManager getComponentManager() {
    return this.componentManager;
  }

}
